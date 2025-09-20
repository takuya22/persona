import { ChatRequest, FetchChatsResponse, SaveChatRequest } from "@/features/chats/types/chats.types";

/**
 * チャットAPIへPOSTし、ストリームを返す
 */
export const postChat = async (
  args: ChatRequest
): Promise<ReadableStream<Uint8Array>> => {
  console.log("Posting chat with args:", args);
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
  const data = await res.json();
  return data as FetchChatsResponse[];
}
