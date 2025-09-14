'use client'
import { useState } from 'react'

type Msg = { role: 'user'|'assistant', text: string }

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  const send = async () => {
    const userMsg: Msg = { role: 'user', text: input }
    setMessages(m => [...m, userMsg])
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'USER_ID',
        sessionId: '4866805151664439296',
        newMessage: { role: 'user', parts: [{ text: userMsg.text }] }
      })
    })

    if (!res.ok || !res.body) {
      const text = await res.text()
      setMessages(m => [...m, { role:'assistant', text:`[error] ${text}` }])
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // イベントは空行で区切られる（CRLF/LF両対応）
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() || ''

      for (const evt of events) {
        // コメント行/keepaliveは無視
        if (/^:\s?/.test(evt)) continue
        const lines = evt.split(/\r?\n/)

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const e = JSON.parse(payload)
            const delta = e.deltaText
              ?? e.text
              ?? e.delta
              ?? e?.content?.parts?.[0]?.text
              ?? ''
            if (!delta) continue
            setMessages(m => {
              const last = m[m.length - 1]
              return last?.role === 'assistant'
                ? [...m.slice(0,-1), { role:'assistant', text: last.text + delta }]
                : [...m, { role:'assistant', text: delta }]
            })
          } catch { /* 非JSONは無視 */ }
        }
      }
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <div className="space-y-2">
        {messages.map((m,i)=>(
          <div key={i} className={m.role==='user'?'text-right':'text-left'}>
            <div className={`inline-block rounded px-3 py-2 ${m.role==='user'?'bg-blue-100':'bg-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2"
               value={input} onChange={e=>setInput(e.target.value)}
               placeholder="メッセージを入力"/>
        <button onClick={send} className="px-4 py-2 rounded bg-black text-white">送信</button>
      </div>
    </main>
  )
}