import { Message } from "../types/chats.types";

export const fetchMessages = async (
  session_id: string
): Promise<Message[]> => {
  const url = `/api/supabase/messages?sessionId=${encodeURIComponent(session_id)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to fetch messages: ${msg}`);
  }

  const data = await res.json();
  return data.map((item: any) => ({
    id: item.id,
    sessionId: item.session_id,
    role: item.role,
    content: item.content,
    author: item.author,
    createdAt: item.created_at,
  } as Message));
}

export const saveMessage = async (
  message: Message
): Promise<void> => {
  const res = await fetch("/api/supabase/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to save message: ${msg}`);
  }
}