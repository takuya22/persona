import { ChatRequest, FetchChatsResponse, SaveChatRequest } from "@/features/chats/types/chats.types";

/**
 * チャットAPIへPOSTし、ストリームを返す
 */
export const postChat = async (
  args: ChatRequest
): Promise<ReadableStream<Uint8Array>> => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to post chat: ${msg}`);
  }

  // サーバーからのSSE/ストリームをそのまま返す
  return res.body;
};

export const saveChat2 = async (
  args: SaveChatRequest
): Promise<Response> => {
  const res = await fetch("/api/supabase/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to save chat: ${msg}`);
  }

  return res;
};

export const fetchChats = async (): Promise<FetchChatsResponse[]> => {
  const res = await fetch("/api/supabase/chats", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to fetch chats: ${msg}`);
  }
  
  const raw = await res.json();
  const rows = Array.isArray(raw) ? raw : raw?.data ?? [];
  const mapped = rows.map((r: { id: any; session_id: any; title: any; first_message: any; updated_at: string | number | Date; }): FetchChatsResponse => ({
    id: String(r.id),
    session_id: r.session_id,
    title: r.title ?? "",
    first_message: r.first_message ?? "",
    updated_at: new Date(r.updated_at).toISOString(),
  }));

  return mapped;
}

export const deleteChat = async (sessionId: string): Promise<void> => {
  const res = await fetch(`/api/supabase/chats?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to delete chat: ${msg}`);
  }
};

export const updateChatTitle = async (sessionId: string, title: string): Promise<void> => {
  const res = await fetch(`/api/supabase/chats?sessionId=${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to update chat title: ${msg}`);
  }
};
