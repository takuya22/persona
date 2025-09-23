// apps/web/lib/api/session.ts

import { CreateSessionResponse } from "@/features/session/types/session.types";

export const createSession = async (
  role: string
): Promise<CreateSessionResponse> => {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to create session: ${msg}`);
  }
  return res.json() as Promise<CreateSessionResponse>;
}
