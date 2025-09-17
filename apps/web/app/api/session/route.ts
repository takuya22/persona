import { auth } from "@/app/auth"
import { getAccessToken } from "@/lib/gcp/auth"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
	const session = await auth()
	console.log("Session:", session)
	if (!session) {
		return new Response("Unauthorized", { status: 401 })
	}

	const url = process.env.VERTEX_AI_QUERY_API_URL!
	console.log("Session API URL:", url)
	const body = {
		class_method: "async_create_session",
		input: { user_id: session.user?.id },
	}
	console.log("Request body:", body)
	
	const res = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${await getAccessToken()}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	})

	if (!res.ok) {
		console.log("Request error:", res)
		return new Response("Request error", { status: 502 })
	}
	
	const data = await res.json()
	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	})
}
