// app/chats/page.tsx など（Server Component）
// import { fetchChats } from "@/features/chats/apis/chats"; // ※サーバーで実行できる実装に
import ChatPage from "@/features/chats/pages/ChatPage";

// features/chats/apis/chats.server.ts (サーバー専用)
import { headers } from "next/headers";

async function fetchChats() {
  const h = headers();
  const cookie = (await h).get("cookie") ?? "";
  const res = await fetch(`${process.env.WEB_BASE_URL}/api/supabase/chats`, {
    method: "GET",
    headers: { cookie },
    cache: "no-store", // 常に最新に
  });
  if (!res.ok) throw new Error(`Failed to fetch chats: ${res.status}`);
  return (await res.json()) as Array<{
    session_id: string;
    title: string;
    first_message: string;
    updated_at: string;
  }>;
}

export default async function Page() {
  const fetched = await fetchChats(); // サーバーでDB/APIから取得
  const initialChats = (fetched ?? []).map((c) => ({
    sessionId: c.session_id,
    title: c.title,
    persona: "PM",
    firstMessage: c.first_message,
    updatedAt: c.updated_at,
    messages: [],
  }));

  return <ChatPage initialChats={initialChats} />;
}