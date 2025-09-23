import { auth } from "@/app/auth"
import { getAccessToken } from "@/lib/gcp/auth"
import { getAgentUrlByRole } from "@/lib/getAgentUrl"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
	const session = await auth()
	if (!session) {
		return new Response("Unauthorized", { status: 401 })
	}
    const { sessionId, role } = await req.json()

	const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/us-central1/reasoningEngines/${getAgentUrlByRole(role)}:query`
	const body = {
		class_method: "async_get_session",
		input: { user_id: session.user?.id, session_id: sessionId },
	}
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