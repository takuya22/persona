// apps/web/lib/api/session.ts

import { CreateSessionResponse } from "@/features/session/types/session.types";

export const createSession = async (): Promise<CreateSessionResponse> => {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to create session: ${msg}`);
  }
  return res.json() as Promise<CreateSessionResponse>;
}

// import { apiProxy } from '@/external/flier-api/apiProxy'
// import { PostInquiryResponse } from '@/feature/inquire/types/inquire.types'

// export const postInquiry = (
//   email: string,
//   type: string,
//   body: string,
//   user_agent: string
// ): Promise<PostInquiryResponse> => {
//   return apiProxy.post<PostInquiryResponse>('/api/inquiry', {
//     email,
//     type,
//     body,
//     user_agent,
//   })
// }
