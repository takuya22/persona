// apps/web/app/api/chat/route.ts
import { NextRequest } from "next/server"
import { GoogleAuth } from "google-auth-library"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PROJECT = process.env.GCP_PROJECT_ID ?? "persona-472007"
const LOCATION = process.env.GCP_LOCATION ?? "us-central1"
const ENGINE_ID = process.env.AGENT_ENGINE_ID ?? "7012144202234462208"
const ENGINE = `projects/${PROJECT}/locations/${LOCATION}/reasoningEngines/${ENGINE_ID}`

async function getAccessToken() {
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] })
  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error("Failed to get access token")
  return token
}

export async function POST(req: NextRequest) {
  const { userId = "anon", sessionId, newMessage } = await req.json()
  const text = newMessage?.parts?.[0]?.text ?? ""
  const sid = sessionId || crypto.randomUUID()
  const token = await getAccessToken()

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/reasoningEngines/${ENGINE_ID}:streamQuery?alt=sse`
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

  // ← ここがポイント：上流が NDJSON でも SSE に“包み直す”
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