"use client";
import { postChat } from "@/features/chats/apis/chats";
import { ChatList } from "@/features/chats/components/ChatList";
import { ChatSearchBox } from "@/features/chats/components/ChatSearchBox";
import { Composer } from "@/features/chats/components/Composer";
import { Footer } from "@/features/chats/components/Footer";
import { MainHeader } from "@/features/chats/components/MainHeader";
import { Messages } from "@/features/chats/components/Messages";
import { SideHeader } from "@/features/chats/components/SideHeader";
import { AIResponseData, Chat, Message } from "@/features/chats/types/chats.types";
import { defaultSeed, deleteStartChat, loadChats, loadStartChat, now, saveChats, timeAgo, uid } from "@/features/chats/utils/chats";
import { createSession } from "@/features/session/apis/session";
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
    // const saved = typeof window !== "undefined" ? loadChats() : [];
    // if (saved.length) {
    //   setChats(saved);
    //   setSelectedId(saved[0]?.id ?? "");
    // } else {
    //   const seed = defaultSeed();
    //   setChats(seed);
    //   setSelectedId(seed[0]?.id ?? "");
    //   saveChats(seed);
    // }

    const startChat = typeof window !== "undefined" ? loadStartChat() : "";
    console.log(startChat + ":storage")
    if (startChat.length > 0) {
      // const chatId = createChat();
      console.log(startChat);
      startSend(startChat);
      deleteStartChat();
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
  const createChat = (sessionId: string): string => {
    const c: Chat = {
      id: sessionId,
      title: "新しいチャット",
      persona: "PM",
      updatedAt: now(),
      messages: [{ id: uid(), role: "system", content: "ペルソナ: PM", createdAt: now() }],
    };
    const next = [c, ...chats];
    setChats(next);
    setSelectedId(c.id);
    setTimeout(() => inputRef.current?.focus(), 0);
    return c.id;
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

  // ユーティリティ: ReadableStreamをテキストとして取得
  async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    let result = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
      console.log(result);
    }
    return result;
  }

  // データ抽出用のユーティリティ関数
  const extractMessageContent = (data: AIResponseData | string): string => {
    if (typeof data === 'string') {
      return data;
    }
    
    try {
      // content.parts[0].text からメッセージ内容を抽出
      return data.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.warn('Failed to extract message content:', error);
      return JSON.stringify(data);
    }
  };

  // 修正されたストリーム完了判定
  const isStreamComplete = (data: AIResponseData | string): boolean => {
    if (typeof data === 'string') {
      return data === '[DONE]' || data === 'STREAM_END';
    }
    
    // ReviewSynthesisAgentの出現で全体完了と判定
    return data.author === 'ReviewSynthesisAgent';
  };

  // 作者情報の取得
  const getAuthor = (data: AIResponseData): string => {
    return data.author || 'AI';
  };

  // トークン使用量の取得
  const getTokenUsage = (data: AIResponseData): number => {
    return data.usage_metadata?.total_token_count || 0;
  };


  // SSEストリームを解析してリアルタイムでメッセージを更新する関数
  async function processSSEStream(
    stream: ReadableStream<Uint8Array>,
    onDataReceived: (content: string, data: AIResponseData) => void,
    onComplete: () => void
  ) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let messageCount = 0;
    const receivedAuthors = new Set(); // 受信したauthorを追跡
    let synthesisReceived = false; // ReviewSynthesisAgent受信フラグ

    try {
      console.log('🔄 Starting SSE stream processing...');
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        // バッファに新しいチャンクを追加
        buffer += decoder.decode(value, { stream: true });
        // 行ごとに分割して処理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // 最後の不完全な行は次回に持ち越し

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            console.log('SSE data:', dataStr);
            
            // 明示的な終了シグナルのみでストリームを終了
            if (dataStr === '[DONE]' || dataStr === 'STREAM_END') {
              console.log('🔚 Received explicit end signal:', dataStr);
              onComplete();
              return;
            }

            if (dataStr) {
              try {
                const data: AIResponseData = JSON.parse(dataStr);
                const content = extractMessageContent(data);
                
                messageCount++;
                receivedAuthors.add(data.author);
                
                console.log(`📨 Message ${messageCount} from ${data.author}:`, {
                  branch: data.branch,
                  content: content.substring(0, 100) + '...',
                  finishReason: data.finish_reason,
                  timestamp: data.timestamp
                });
                
                if (content) {
                  onDataReceived(content, data);
                }
              
                // ReviewSynthesisAgentが来たらストリーム完了
                if (data.author === 'ReviewSynthesisAgent') {
                  console.log('🏁 ReviewSynthesisAgent received - stream complete!');
                  synthesisReceived = true;
                  
                  // 少し待ってからストリーム終了（最後のメッセージを確実に処理）
                  setTimeout(() => {
                    onComplete();
                  }, 100);
                  return;
                }
                
              } catch (e) {
                console.warn('❌ Failed to parse JSON:', e);
                console.log('🔍 Raw data:', dataStr.substring(0, 200));
                // JSON解析に失敗してもストリームを継続
              }
            }
          } else if (trimmed.startsWith(':')) {
            console.log('💭 SSE keepalive:', trimmed);
          } else if (trimmed === '') {
            // 空行は無視
          } else {
            console.log('❓ Unknown format:', trimmed.substring(0, 100));
          }
        }
      }
    } catch (error) {
      console.error('SSE stream processing error:', error);
      onComplete();
    } finally {
      reader.releaseLock();
    }
  }

  const startSend = async (input: string) => {
    if (!input.trim()) return;
    const userMsg: Message = { id: uid(), role: "user", content: input.trim(), createdAt: now() };
    setInput("");
    setIsSending(true);
    setIsTyping(true);

    // Simulate assistant typing
    const session = await createSession();
    const chatId = createChat(session.output.id);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, userMsg], updatedAt: now() } : c))
    );

    try {
      const stream = await postChat({ sessionId: session.output.id, newMessage: { parts: [ { text: input.trim() } ] } });

      let authorCount = new Set();
      let reviewerCount = 0;
      let synthesisReceived = false;

      // SSEストリームを処理
      await processSSEStream(
        stream,
        // 各data行を受信したときの処理
        (content: string, data: AIResponseData) => {
          authorCount.add(data.author);
        
          if (data.author.includes('Reviewer')) {
            reviewerCount++;
          } else if (data.author === 'ReviewSynthesisAgent') {
            synthesisReceived = true;
          }

          console.log(`📝 ${data.author} (Reviewers: ${reviewerCount}, Synthesis: ${synthesisReceived})`);

          if (content) {
            // 各data行ごとに新しいアシスタントメッセージを作成
            const newAssistantMsg: Message = {
              id: uid(),
              role: "assistant", 
              content: content,
              createdAt: now(),
            };

            // chatsの配列に新しいメッセージを追加
            setChats((prev) =>
              prev.map((c) => 
                c.id === chatId 
                  ? {
                      ...c,
                      messages: [...c.messages, newAssistantMsg], // 配列の末尾に新しいメッセージを追加
                      updatedAt: now()
                    }
                  : c
              )
            );
          }
        },
        // ストリーム完了時の処理
        () => {
          console.log('Stream completed');
          setIsTyping(false);
          setIsSending(false);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      
      // エラーメッセージも新しいメッセージとして追加
      const errorMsg: Message = {
        id: uid(),
        role: "assistant",
        content: `エラーが発生しました: ${error.message}`,
        createdAt: now()
      };
      
      setChats((prev) =>
        prev.map((c) => 
          c.id === chatId 
            ? {
                ...c,
                messages: [...c.messages, errorMsg], // エラーメッセージも新規追加
                updatedAt: now()
              }
            : c
        )
      );
    
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const send = async () => {
    if (!selected || !input.trim() || isSending) return;
    const userMsg: Message = { id: uid(), role: "user", content: input.trim(), createdAt: now() };
    setInput("");
    setIsSending(true);
    setIsTyping(true);
    setChats((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, messages: [...c.messages, userMsg], updatedAt: now() } : c))
    );

    try {
      console.log("Creating session...");
      console.log(selected.id);
      console.log(input.trim());
      console.log(chats);
      const stream = await postChat({ sessionId: selected.id, newMessage: { parts: [ { text: input.trim() } ] } });

      let authorCount = new Set();
      let reviewerCount = 0;
      let synthesisReceived = false;

      // SSEストリームを処理
      await processSSEStream(
        stream,
        // 各data行を受信したときの処理
        (content: string, data: AIResponseData) => {
          authorCount.add(data.author);
        
          if (data.author.includes('Reviewer')) {
            reviewerCount++;
          } else if (data.author === 'ReviewSynthesisAgent') {
            synthesisReceived = true;
          }

          console.log(`📝 ${data.author} (Reviewers: ${reviewerCount}, Synthesis: ${synthesisReceived})`);

          if (content) {
            // 各data行ごとに新しいアシスタントメッセージを作成
            const newAssistantMsg: Message = {
              id: uid(),
              role: "assistant", 
              content: content,
              createdAt: now(),
            };

            // chatsの配列に新しいメッセージを追加
            setChats((prev) =>
              prev.map((c) => 
                c.id === selected.id 
                  ? {
                      ...c,
                      messages: [...c.messages, newAssistantMsg], // 配列の末尾に新しいメッセージを追加
                      updatedAt: now()
                    }
                  : c
              )
            );
          }
        },
        // ストリーム完了時の処理
        () => {
          console.log('Stream completed');
          setIsTyping(false);
          setIsSending(false);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      
      // エラーメッセージも新しいメッセージとして追加
      const errorMsg: Message = {
        id: uid(),
        role: "assistant",
        content: `エラーが発生しました: ${error.message}`,
        createdAt: now()
      };
      
      setChats((prev) =>
        prev.map((c) => 
          c.id === selected.id 
            ? {
                ...c,
                messages: [...c.messages, errorMsg], // エラーメッセージも新規追加
                updatedAt: now()
              }
            : c
        )
      );
    
      setIsTyping(false);
      setIsSending(false);
    }
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