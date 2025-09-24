"use client";
import { deleteChat, postChat, saveChat2, updateChatTitle } from "@/features/chats/apis/chats";
import { fetchMessages, saveMessage } from "@/features/chats/apis/message";
import { ChatList } from "@/features/chats/components/ChatList";
import { ChatSearchBox } from "@/features/chats/components/ChatSearchBox";
import { Composer } from "@/features/chats/components/Composer";
import { Footer } from "@/features/chats/components/Footer";
import { MainHeader } from "@/features/chats/components/MainHeader";
import { Messages } from "@/features/chats/components/Messages";
import { SideHeader } from "@/features/chats/components/SideHeader";
import { AIResponseData, Chat, Message } from "@/features/chats/types/chats.types";
import { deleteStartChat, loadStartChat, saveChats, uid } from "@/features/chats/utils/chats";
import { groups, personas } from "@/features/persona/types/persona.type";
import { createSession } from "@/features/session/apis/session";
import dayjs from "dayjs";
import ja from 'dayjs/locale/ja';
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Persona Interview – Chat Page
 * - Tailwind only / single-file React component (no external UI libs)
 * - Sidebar with multi-chat list (search / create / rename / delete)
 * - Main chat: header (persona + title), messages stream, composer
 * - Typing indicator, Cmd/Ctrl+Enter to send, auto-scroll, localStorage persistence
 * - Very small mock LLM responder to simulate replies
 */


type Props = { initialChats: Chat[] };
dayjs.locale(ja);

// ------------------------ Component ------------------------

export default function ChatPage({ initialChats }: Props) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedId, setSelectedId] = useState<string>("");
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const selected = useMemo(() => chats.find((c) => c.sessionId === selectedId) || null, [chats, selectedId]);

//   useEffect(() => saveChats(chats), [chats]);

  // 初回マウント時にDBから読み込む
  useEffect(() => {
    const startChat = typeof window !== "undefined" ? loadStartChat() : "";
    if (startChat && startChat.input.length > 0) {
      startSend(startChat.input, startChat.role);
      deleteStartChat();
    }
  }, []);

  // // 選択中のチャットが切り替わったらメッセージを取得
  useEffect(() => {
    if (!selected) return;
    if ((selected.messages ?? []).length > 0) return; // すでに取得済み
    let cancelled = false;

    (async () => {
      try {
        const messages = await fetchMessages(selected.sessionId);
        if (cancelled) return; // 選択が変わった / アンマウント時は反映しない
        setChats(prev =>
          prev.map(c =>
            c.sessionId === selected.sessionId
              ? { ...c, messages }
              : c
          )
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, selected]);

  // chatsが変わったら保存
  useEffect(() => {
    if (chats.length) saveChats(chats);
  }, [chats]);

  // Auto-scroll to bottom on new messages
  // useEffect(() => {
  //   if (!streamRef.current) return;
  //   streamRef.current.scrollTop = streamRef.current.scrollHeight;
  // }, [selected?.messages.length, isTyping]);

  // Handlers
  const createChat = (sessionId: string, input: string, role: string): string => {

    const userMsg: Message = { id: uid(), sessionId: sessionId, role: "user", content: input, createdAt: dayjs().format() };
    saveChat2({
      sessionId: sessionId,
      title: "新しいチャット",
      firstMessage: input.trim(),
      role: role,
    });
    saveMessage({
      sessionId: sessionId,
      role: "user",
      content: input.trim(),
      createdAt: dayjs().format(),
    } as Message);
    setChats(prev => {
    const next = [{
        sessionId: sessionId,
        title: "新しいチャット",
        role: role,
        firstMessage: input,
        updatedAt: dayjs().format(),
        messages: [userMsg],
    }, ...prev];
    return next;
    });

    setSelectedId(sessionId);
    setTimeout(() => inputRef.current?.focus(), 0);
    return sessionId;
  };

  const removeChat = (sessionId: string) => {
    const idx = chats.findIndex((c) => c.sessionId === sessionId);
    if (idx === -1) return;
    const next = chats.filter((c) => c.sessionId !== sessionId);
    setChats(next);
    deleteChat(sessionId);
    if (selectedId === sessionId) setSelectedId(next[0]?.sessionId ?? "");
  };

  const renameChat = (sessionId: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.sessionId === sessionId ? { ...c, title, updatedAt: dayjs().format() } : c)));
    updateChatTitle(sessionId, title)
  };


  // 作者情報の取得
  const getAuthor = (data: AIResponseData): string => {
    return data.author || 'AI';
  };

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
            
            // 明示的な終了シグナルのみでストリームを終了
            if (dataStr === '[DONE]' || dataStr === 'STREAM_END') {
              onComplete();
              return;
            }

            if (dataStr) {
              try {
                const data: AIResponseData = JSON.parse(dataStr);
                const content = extractMessageContent(data);
                
                messageCount++;
                receivedAuthors.add(data.author);
                
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

  const newChat = async (role: string) => {
    const newSessionId = "newChat_" + uid();
    setChats(prev => [{
        sessionId: newSessionId,
        title: "新しいチャット",
        role: role,
        firstMessage: input,
        updatedAt: dayjs().format(),
        messages: [],
    }, ...prev]);
    setSelectedId(newSessionId);
  };

  const handleSelectPersona = (role: string) => {
    setShowPersonaModal(false);
    newChat(role);
  };

  const startSend = async (input: string, role: string) => {
    if (!input.trim()) return;
    setInput("");
    setIsSending(true);
    setIsTyping(true);
    
    // Simulate assistant typing
    const session = await createSession(role);
    const chatId = createChat(session.output.id, input.trim(), role);

    try {
      const stream = await postChat({ sessionId: session.output.id, role: role, newMessage: { parts: [ { text: input.trim() } ] } });

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
              sessionId: session.output.id,
              role: "assistant", 
              content: content,
              author: getAuthor(data),
              createdAt: dayjs().format(),
            };

            // chatsの配列に新しいメッセージを追加
            setChats((prev) =>
              prev.map((c) => 
                c.sessionId === chatId 
                  ? {
                      ...c,
                      messages: [...c.messages ?? [], newAssistantMsg], // 配列の末尾に新しいメッセージを追加
                      updatedAt: dayjs().format()
                    }
                  : c
              )
            );

            // DBにも保存
            saveMessage({
              sessionId: session.output.id,
              role: "assistant",
              content: content,
              author: getAuthor(data),
              createdAt: dayjs().format(),
            } as Message);
          }
        },
        // ストリーム完了時の処理
        () => {
          setIsTyping(false);
          setIsSending(false);
        }
      );
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // エラーメッセージも新しいメッセージとして追加
      const errorMsg: Message = {
        id: uid(),
        sessionId: session.output.id,
        role: "assistant",
        content: `エラーが発生しました: ${error.message}`,
        createdAt: dayjs().format()
      };
      
      setChats((prev) =>
        prev.map((c) => 
          c.sessionId === chatId 
            ? {
                ...c,
                messages: [...c.messages ?? [], errorMsg], // エラーメッセージも新規追加
                updatedAt: dayjs().format()
              }
            : c
        )
      );
    
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const send = async () => {
    console.log("Sending message:", input);
    if (!selected || !input.trim() || isSending) return;

    const messageContent = input.trim();
    setInput("");
    setIsSending(true);
    setIsTyping(true);
    console.log("Selected chat:", selected);
    let currentSessionId = selected.sessionId;
    const currentRole = selected.role;

    // 新しいチャットの場合はセッションを作成してチャットのsessionIdを更新
    if (selected.sessionId.includes("newChat")) {
      console.log("Creating new session for new chat...");
      const session = await createSession(currentRole);
      currentSessionId = session.output.id;

      // チャットのsessionIdを更新
      setChats((prev) =>
        prev.map((c) =>
          c.sessionId === selected.sessionId
            ? { ...c, sessionId: currentSessionId, updatedAt: dayjs().format(), firstMessage: input.trim() }
            : c
        )
      );
      setSelectedId(currentSessionId);
      saveChat2({
        sessionId: currentSessionId,
        title: selected.title,
        firstMessage: input.trim(),
        role: currentRole,
      });
    }

    // ユーザーメッセージを作成
    const userMsg: Message = { 
      id: uid(), 
      sessionId: currentSessionId, 
      role: "user", 
      content: messageContent, 
      createdAt: dayjs().format() 
    };

    // ユーザーメッセージをchatsに追加
    setChats((prev) =>
      prev.map((c) => 
        c.sessionId === currentSessionId || c.sessionId === selected.sessionId
          ? { 
              ...c, 
              sessionId: currentSessionId,
              firstMessage: messageContent, 
              messages: [...(c.messages ?? []), userMsg], 
              updatedAt: dayjs().format() 
            }
          : c
      )
    );

    // DBにも保存
    saveMessage({
      sessionId: currentSessionId,
      role: "user",
      content: input.trim(),
      createdAt: dayjs().format(),
    } as Message);

    try {
      const stream = await postChat({ sessionId: currentSessionId, role: currentRole, newMessage: { parts: [ { text: input.trim() } ] } });

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
              sessionId: currentSessionId,
              role: "assistant", 
              content: content,
              author: getAuthor(data),
              createdAt: dayjs().format(),
            };

            // chatsの配列に新しいメッセージを追加
            setChats((prev) =>
              prev.map((c) => 
                c.sessionId === currentSessionId
                  ? {
                      ...c,
                      messages: [...c.messages ?? [], newAssistantMsg], // 配列の末尾に新しいメッセージを追加
                      updatedAt: dayjs().format()
                    }
                  : c
              )
            );

            // DBにも保存
            saveMessage({
              sessionId: currentSessionId,
              role: "assistant",
              content: content,
              author: getAuthor(data),
              createdAt: dayjs().format(),
            } as Message);
          }
        },
        // ストリーム完了時の処理
        () => {
          console.log('Stream completed');
          setIsTyping(false);
          setIsSending(false);
        }
      );
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // エラーメッセージも新しいメッセージとして追加
      const errorMsg: Message = {
        id: uid(),
        sessionId: currentSessionId,
        role: "assistant",
        content: `エラーが発生しました: ${error.message}`,
        createdAt: dayjs().format()
      };
      
      setChats((prev) =>
        prev.map((c) => 
          c.sessionId === currentSessionId
            ? {
                ...c,
                messages: [...c.messages ?? [], errorMsg], // エラーメッセージも新規追加
                updatedAt: dayjs().format()
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
  
// filteredの計算部分をデバッグ版に置き換え
const filtered = useMemo(() => {
  const q = sidebarQuery.toLowerCase();
  if (!q) {
    return chats;
  }

  const result = chats.filter((c, index) => {
    const searchableFields = [
      c.title,
      c.role,
      c.firstMessage,
      ...((c.messages ?? []).map((m) => m.content)),
    ];
    
    const matches = searchableFields.map((field, fieldIndex) => {
      const fieldStr = String(field).toLowerCase();
      const isMatch = fieldStr.includes(q);
      return isMatch;
    });
    const hasMatch = matches.some(m => m);
    return hasMatch;
  });
  return result;
}, [chats, sidebarQuery]);

  return (
    <div className="h-screen w-full grid grid-cols-[280px_1fr] bg-white text-slate-900 md:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="border-r flex flex-col min-w-0 min-h-0">
        <SideHeader openPersonaModal={() => setShowPersonaModal(true)} />
        <ChatSearchBox sidebarQuery={sidebarQuery} setSidebarQuery={setSidebarQuery} />
        <ChatList filtered={filtered} selectedId={selectedId} setSelectedId={setSelectedId} renameChat={renameChat} removeChat={removeChat} />
        <Footer />
      </aside>

      {/* Main */}
      <section className="flex flex-col min-w-0 min-h-0">
        {/* <MainHeader selected={selected} switchPersona={switchPersona} /> */}
        <MainHeader selected={selected} />
        <Messages streamRef={streamRef} selected={selected} isTyping={isTyping} />
        <Composer selected={selected} input={input} inputRef={inputRef} setInput={setInput} onKeyDown={onKeyDown} send={send} isSending={isSending} />
      </section>


      {showPersonaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">ペルソナを選択</h2>
            <div className="grid gap-3 mb-5">
              <button
                onClick={() => handleSelectPersona("all")}
                className="w-full text-left px-4 py-2 rounded-lg border hover:bg-slate-50 transition text-sm"
              >
                全員
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleSelectPersona(g.id)}
                  className="w-full text-left px-4 py-2 rounded-lg border hover:bg-slate-50 transition text-sm"
                >
                  {g.name}
                </button>
              ))}
              {personas.filter((p) => p.id !== "housewife" && p.id !== "retiree" && p.id !== "student" && p.id !== "teen").map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p.id)}
                  className="w-full text-left px-4 py-2 rounded-lg border hover:bg-slate-50 transition text-sm"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPersonaModal(false)}
                className="px-3 h-9 text-sm rounded-md border hover:bg-slate-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ------------------------ Tailwind helpers ------------------------
// You can place this utility in your global CSS once:
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }