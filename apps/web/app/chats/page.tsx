"use client";
import { ChatList } from "@/features/chats/components/ChatList";
import { ChatSearchBox } from "@/features/chats/components/chatSearchBox";
import { Composer } from "@/features/chats/components/Composer";
import { Footer } from "@/features/chats/components/Footer";
import { MainHeader } from "@/features/chats/components/MainHeader";
import { Messages } from "@/features/chats/components/Messages";
import { SideHeader } from "@/features/chats/components/SideHeader";
import { defaultSeed, loadChats, now, saveChats, timeAgo, uid } from "@/features/chats/utils/chats";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Persona Interview – Chat Page
 * - Tailwind only / single-file React component (no external UI libs)
 * - Sidebar with multi-chat list (search / create / rename / delete)
 * - Main chat: header (persona + title), messages stream, composer
 * - Typing indicator, Cmd/Ctrl+Enter to send, auto-scroll, localStorage persistence
 * - Very small mock LLM responder to simulate replies
 */

// Mini Mock LLM (replace with your backend)
async function mockRespond(prompt: string, persona: string): Promise<string> {
  const suggestions: Record<string, string[]> = {
    PM: [
      "目標指標(継続率)を分解すると、初回のAHA到達率と2回目来訪率が肝です。次にどちらを優先しますか？",
      "直近のユーザーフィードバックで、体験の摩擦が増える箇所はどこでしたか？",
      "今の仮説を3つに絞って、計測イベントと打ち手を対応づけましょう。",
    ],
    Design: [
      "コピーは『価値の結果』を明示して、次に『行動』を促すと良いです。候補文を1つ書いてみますか？",
      "バナーの視線誘導は充分でしょうか。ヒートマップやスクロール率はありますか？",
      "UIの整合性を保ちつつ差分検証するため、変更は1画面1要素に制限しましょう。",
    ],
    Engineer: [
      "軽量なイベント計測を先に差し込み、データで仮説を選別しましょう。",
      "パフォーマンス計測(LCP/INP)の閾値は満たしていますか？",
      "ABのバリアント分岐はフラグで管理し、ロールバック容易に。",
    ],
    Marketing: [
      "流入チャネル別に初回滞在時間の差はありますか？配信クリエイティブと一貫性を取りましょう。",
      "獲得後のナーチャリング(ウェルカムメール)で次の最適行動を提案しましょう。",
      "セグメント別のモチベーション仮説を洗い出し、メッセージを調整します。",
    ],
    Sales: [
      "商談前後でプロダクト認知のズレがないか、事例資料を整備しましょう。",
      "導入後の成功指標を事前合意できていますか？",
      "失注理由の定性ログを元に、BANT視点での問診項目を更新しましょう。",
    ],
    HR: [
      "候補者体験のボトルネックはどこですか？応募→一次面接の離脱率を見ましょう。",
      "オンボーディング計画に、30/60/90日の学習目標とメンター制度を。",
      "リテンション課題は1on1ログからテーマ抽出を。",
    ],
  };
  const pool = suggestions[persona as keyof typeof suggestions] || suggestions.PM;
  const tail = pool[Math.floor(Math.random() * pool.length)];
  // Fake thinking time
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 900));
  return `${tail}`;
}

// ------------------------ Component ------------------------

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => chats.find((c) => c.id === selectedId) || null, [chats, selectedId]);

  useEffect(() => saveChats(chats), [chats]);

  // 初回マウント時にlocalStorageから読み込む
  useEffect(() => {
    const saved = typeof window !== "undefined" ? loadChats() : [];
    if (saved.length) {
      setChats(saved);
      setSelectedId(saved[0]?.id ?? "");
    } else {
      const seed = defaultSeed();
      setChats(seed);
      setSelectedId(seed[0]?.id ?? "");
      saveChats(seed);
    }
  }, []);

  // chatsが変わったら保存
  useEffect(() => {
    if (chats.length) saveChats(chats);
  }, [chats]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [selected?.messages.length, isTyping]);

  // Handlers
  const createChat = () => {
    const c: Chat = {
      id: uid(),
      title: "新しいチャット",
      persona: "PM",
      updatedAt: now(),
      messages: [{ id: uid(), role: "system", content: "ペルソナ: PM", createdAt: now() }],
    };
    const next = [c, ...chats];
    setChats(next);
    setSelectedId(c.id);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeChat = (id: string) => {
    const idx = chats.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const next = chats.filter((c) => c.id !== id);
    setChats(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? "");
  };

  const renameChat = (id: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title, updatedAt: now() } : c)));
  };

  const switchPersona = (persona: string) => {
    if (!selected) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              persona,
              updatedAt: now(),
              messages: [
                ...c.messages,
                { id: uid(), role: "system", content: `ペルソナ変更: ${persona}`, createdAt: now() },
              ],
            }
          : c
      )
    );
  };

  const send = async () => {
    if (!selected || !input.trim() || isSending) return;
    const userMsg: Message = { id: uid(), role: "user", content: input.trim(), createdAt: now() };
    setInput("");
    setIsSending(true);
    setChats((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, messages: [...c.messages, userMsg], updatedAt: now() } : c))
    );

    // Simulate assistant typing
    setIsTyping(true);
    const reply = await mockRespond(userMsg.content, selected.persona);
    const aiMsg: Message = { id: uid(), role: "assistant", content: reply, createdAt: now() };
    setChats((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, messages: [...c.messages, aiMsg], updatedAt: now() } : c))
    );
    setIsTyping(false);
    setIsSending(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  // Filter chats in sidebar
  const filtered = chats.filter((c) =>
    [c.title, c.persona, ...c.messages.slice(-3).map((m) => m.content)].some((s) =>
      s.toLowerCase().includes(sidebarQuery.toLowerCase())
    )
  );

  return (
    <div className="h-screen w-full grid grid-cols-[280px_1fr] bg-white text-slate-900 md:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="border-r flex flex-col min-w-0">
        <SideHeader createChat={createChat} />
        <ChatSearchBox sidebarQuery={sidebarQuery} setSidebarQuery={setSidebarQuery} />
        <ChatList filtered={filtered} selectedId={selectedId} setSelectedId={setSelectedId} renameChat={renameChat} removeChat={removeChat} />
        <Footer />
      </aside>

      {/* Main */}
      <section className="flex flex-col min-w-0">
        <MainHeader selected={selected} switchPersona={switchPersona} />
        <Messages streamRef={streamRef} selected={selected} isTyping={isTyping} />
        <Composer selected={selected} input={input} inputRef={inputRef} setInput={setInput} onKeyDown={onKeyDown} send={send} isSending={isSending} />
      </section>
    </div>
  );
}



// ------------------------ Tailwind helpers ------------------------
// You can place this utility in your global CSS once:
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }