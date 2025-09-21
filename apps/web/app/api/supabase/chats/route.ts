import { auth } from "@/app/auth"
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server"

export interface PostChatRequest {
  sessionId: string;
  userId: string;
  title: string;
  firstMessage: string;
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { sessionId, title, firstMessage } = await req.json()

  const body: PostChatRequest = {
    sessionId: sessionId,
    userId: session.user?.id!,
    title: title || "New Chat",
    firstMessage: firstMessage || "Hello, how can I help you?",
  }

    const supabase = await createClient();
    const result = await supabase.from("chats").insert({
      session_id: body.sessionId,
      user_id: body.userId,
      title: body.title,
      first_message: body.firstMessage,
      updated_at: new Date().toISOString(),
    })
    console.log("Insert result:", result);

    if (result.error) {
      console.error("Error inserting chat:", result.error);
      return new Response("Internal Server Error", { status: 500 });
    }

  return new Response(JSON.stringify({ message: "Chat created" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", session.user?.id!)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      return new Response("Internal Server Error", { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return new Response("Bad Request: Missing sessionId", { status: 400 })
  }

    const supabase = await createClient();
    const result = await supabase
      .from("chats")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", session.user?.id!);

    if (result.error) {
      console.error("Error deleting chat:", result.error);
      return new Response("Internal Server Error", { status: 500 });
    }

  return new Response(JSON.stringify({ message: "Chat deleted" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return new Response("Bad Request: Missing sessionId", { status: 400 })
  }

  const { title } = await req.json()
  if (typeof title !== "string" || title.trim().length === 0) {
    return new Response("Bad Request: Invalid title", { status: 400 })
  }

    const supabase = await createClient();
    const result = await supabase
      .from("chats")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("user_id", session.user?.id!);

    if (result.error) {
      console.error("Error updating chat title:", result.error);
      return new Response("Internal Server Error", { status: 500 });
    }

  return new Response(JSON.stringify({ message: "Chat title updated" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
