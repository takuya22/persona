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

export const STORAGE_KEY = "persona-interview-chats-v1";

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

export const defaultSeed = (): Chat[] => {
  const c1: Chat = {
    id: uid(),
    title: "Z世代ライトユーザーの継続率",
    persona: "PM",
    updatedAt: now() - 1000 * 60 * 35,
    messages: [
      { id: uid(), role: "system", content: "ペルソナ: PM", createdAt: now() - 1000 * 60 * 35 },
      { id: uid(), role: "user", content: "ライトユーザーの継続率が伸びません。初回体験のボトルネックを探したい。", createdAt: now() - 1000 * 60 * 34 },
      { id: uid(), role: "assistant", content: "PM視点だと、オンボーディングの最初の３クリックに注目します。現状の主要動線を教えてください。", createdAt: now() - 1000 * 60 * 33 },
    ],
  };
  const c2: Chat = {
    id: uid(),
    title: "ABテスト設計の相談",
    persona: "Design",
    updatedAt: now() - 1000 * 60 * 120,
    messages: [
      { id: uid(), role: "system", content: "ペルソナ: Design", createdAt: now() - 1000 * 60 * 120 },
      { id: uid(), role: "user", content: "新しいヒーローのコピー、どちらが好まれるか検証したい。", createdAt: now() - 1000 * 60 * 119 },
      { id: uid(), role: "assistant", content: "ファーストビューの視認性を固定してコピーだけを変えるのが良いです。計測指標は何にしますか？", createdAt: now() - 1000 * 60 * 118 },
    ],
  };
  return [c1, c2];
};