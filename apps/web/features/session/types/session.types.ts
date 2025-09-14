export interface CreateSessionRequest {
  userId: string
}

export interface CreateSessionResponse {
  output: SessionResponse
}

export interface SessionResponse {
  id: string
  userId: string
}