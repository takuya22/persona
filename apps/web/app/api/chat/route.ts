// apps/web/app/api/chat/route.ts
import { NextRequest } from "next/server"
import { getAccessToken } from "@/lib/gcp/auth"
import { auth } from "@/app/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { sessionId, newMessage } = await req.json()
  const text = newMessage?.parts?.[0]?.text ?? ""
  const sid = sessionId || crypto.randomUUID()
  const token = await getAccessToken()

  if (!token) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (text.trim().length === 0) {
    return new Response("No input text", { status: 400 })
  }

  const url = process.env.VERTEX_AI_STREAM_QUERY_API_URL!
  const body = {
    class_method: "async_stream_query",
    input: { user_id: session.user?.id, session_id: sid, message: text },
  }

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // ここは text/event-stream でも application/x-ndjson でも可
      // 何が返ってきてもサーバでSSE化する方針
      Accept: "*/*",
    },
    body: JSON.stringify(body),
  })

  if (!upstream.ok || !upstream.body) {
    const msg = await upstream.text().catch(() => upstream.statusText)
    return new Response(`Upstream error: ${msg}`, { status: 502 })
  }

  const reader = upstream.body.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let buffer = "";                    // 生テキストのバッファ
  let sseEventLines: string[] = [];   // 1イベント分の行を貯める

  let controllerRef: ReadableStreamDefaultController | null = null
  let keepalive: ReturnType<typeof setInterval> | null = null
  
  function flushBufferAsEvents(chunk: string, controller: ReadableStreamDefaultController) {
    const lines = chunk.split(/\r?\n/)
    for (const raw of lines) {
      const line = raw.trimEnd()
      if (line === "") {
        if (sseEventLines.length) {
          controller.enqueue(encoder.encode(sseEventLines.join("\n") + "\n\n"))
          sseEventLines = []
        }
        continue
      }
      if (line.startsWith("data:") || line.startsWith(":") || line.startsWith("event:") || line.startsWith("id:")) {
        sseEventLines.push(line)
      } else {
        controller.enqueue(encoder.encode(`data: ${line}\n\n`)) // NDJSON 1行→1イベント
      }
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      // keepalive は start でセット（controller を確実に取得できる）
      keepalive = setInterval(() => {
        try {
          controllerRef?.enqueue(encoder.encode(`:keepalive ${Date.now()}\n\n`))
        } catch {}
      }, 15_000)
    },
    async pull(controller) {
      // 念のため pull 側でも参照を保持
      controllerRef = controller

      const { value, done } = await reader.read()
      if (done) {
        buffer += decoder.decode() // flush
        if (buffer) flushBufferAsEvents(buffer, controller)
        if (keepalive) clearInterval(keepalive)
        controller.close()
        return
      }

      buffer += decoder.decode(value, { stream: true })
      const lastNL = buffer.lastIndexOf("\n")
      if (lastNL !== -1) {
        const chunk = buffer.slice(0, lastNL + 1)
        buffer = buffer.slice(lastNL + 1)
        flushBufferAsEvents(chunk, controller)
      }
    },
    cancel() {
      try { reader.cancel() } catch {}
      if (keepalive) clearInterval(keepalive)
      controllerRef = null
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  })
}