export type Role = "user" | "assistant" | "system";

export type Message = {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  author?: string;
  createdAt: string;
};

export type Chat = {
  sessionId: string;
  title: string;
  role: string; // e.g., PM / Design / Engineer
  updatedAt: string;
  firstMessage?: string;
  messages?: Message[];
};

export type ChatRequest = {
  sessionId?: string;
  role: string;
  newMessage: {
    parts: { text: string }[];
  };
};

export type SaveChatRequest = {
  sessionId: string;
  title: string;
  firstMessage: string;
  role: string;
};

export type FetchChatsResponse = {
  id: string;
  session_id: string;
  title: string;
  first_message: string;
  updated_at: string;
}

// ストリームなのでレスポンス型は用途に応じて定義
export type ChatResponse = unknown;

export interface AIResponseData {
  content: {
    parts: Array<{
      text: string;
    }>;
    role: string;
  };
  finish_reason: string;
  usage_metadata: {
    candidates_token_count: number;
    candidates_tokens_details: Array<{
      modality: string;
      token_count: number;
    }>;
    prompt_token_count: number;
    prompt_tokens_details: Array<{
      modality: string;
      token_count: number;
    }>;
    total_token_count: number;
    traffic_type: string;
  };
  invocation_id: string;
  author: string;
  actions: {
    state_delta: Record<string, string>;
    artifact_delta: Record<string, any>;
    requested_auth_configs: Record<string, any>;
    requested_tool_confirmations: Record<string, any>;
  };
  branch: string;
  id: string;
  timestamp: number;
}