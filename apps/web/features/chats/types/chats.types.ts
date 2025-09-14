type Role = "user" | "assistant" | "system";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number; // epoch ms
};

type Chat = {
  id: string;
  title: string;
  persona: string; // e.g., PM / Design / Engineer
  messages: Message[];
  updatedAt: number;
};