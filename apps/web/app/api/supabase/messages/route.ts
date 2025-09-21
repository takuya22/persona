import { auth } from "@/app/auth";
import { createClient } from "@/lib/supabase/server";
import { nowJstIso } from "@/lib/utils";
import { NextRequest } from "next/server";
import { use } from "react";

export interface PostMessageRequest {
  sessionId: string;
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { sessionId, role, content } = await req.json()

  const body: PostMessageRequest = {
    sessionId: sessionId,
    role: role,
    content: content,
  }

    const supabase = await createClient();
    const result = await supabase.from("messages").insert({
      session_id: body.sessionId,
      role: body.role,
      content: body.content,
      user_id: session!.user?.id!,
      created_at: nowJstIso(),
      updated_at: nowJstIso(),
    })
    console.log("Insert result:", result);

    if (result.error) {
      console.error("Error inserting message:", result.error);
      return new Response("Internal Server Error", { status: 500 });
    }

  return new Response(JSON.stringify({ message: "Message created" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return new Response("Bad Request: Missing sessionId", { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", session!.user?.id!)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}