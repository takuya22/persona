import { Chat } from "../types/chats.types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const now = () => Date.now();

export const timeAgo = (t: number) => {
  const diff = Math.max(0, now() - t) / 1000; // sec
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const STORAGE_KEY = "persona-interview-chats-v1";

export const loadChats = (): Chat[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Chat[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveChats = (chats: Chat[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};

const START_CHAT_KEY = "persona-start-chat"

export const saveStartChat = (input: string) => {
  localStorage.setItem(START_CHAT_KEY, input);
}

export const loadStartChat = (): string => {
  try {
    const text = localStorage.getItem(START_CHAT_KEY);
    if (!text) return ""
    return text;
  } catch {
    return ""
  }
}

export const deleteStartChat = (): void => {
  localStorage.removeItem(START_CHAT_KEY)
  return
}
