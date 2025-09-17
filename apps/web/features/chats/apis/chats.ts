import { ChatRequest } from "@/features/chats/types/chats.types";

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