// apps/web/app/api/chat/route.ts
import { NextRequest } from "next/server"
import { getAccessToken } from "@/lib/gcp/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { userId, sessionId, newMessage } = await req.json()
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
    input: { user_id: userId, session_id: sid, message: text },
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
  let leftover = ""

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read()
      if (done) {
        if (leftover.trim()) {
          controller.enqueue(encoder.encode(`data: ${leftover}\n\n`))
        }
        controller.close()
        return
      }
      const chunk = new TextDecoder().decode(value)
      const text = leftover + chunk
      const lines = text.split(/\r?\n/)
      leftover = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        // すでに data: を含む（純SSE）の場合はそのまま流す
        if (trimmed.startsWith("data:")) {
          controller.enqueue(encoder.encode(trimmed + "\n\n"))
        } else if (trimmed.startsWith(":")) {
          // keepalive/comment はそのままSSEとして通す
          controller.enqueue(encoder.encode(trimmed + "\n\n"))
        } else {
          // NDJSON/プレーンJSON行 → SSE化
          controller.enqueue(encoder.encode(`data: ${trimmed}\n\n`))
        }
      }
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