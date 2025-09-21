import { input } from "framer-motion/client";
import { Chat } from "../types/chats.types";

export const Composer: React.FC<{
    selected: Chat | null;
    input: string;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    setInput: (input: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    send: () => void;
    isSending: boolean;
}> = ({ selected, input, inputRef, setInput, onKeyDown, send, isSending }) => {
  return (
    <>
        {/* Composer */}
        <div className="border-t p-3 fixed bottom-0 right-0 bg-white z-10 shadow-lg w-[calc(100%-300px)]">
          <div className="flex items-end gap-2">
            <label htmlFor="composer" className="sr-only">メッセージ</label>
            <textarea
              id="composer"
              ref={inputRef}
              className="flex-1 min-h-[44px] max-h-[160px] rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder={selected ? `@${selected.persona} に質問を書いて…` : "チャットを選択または作成してください"}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto-grow
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${Math.min(160, e.currentTarget.scrollHeight)}px`;
              }}
              onKeyDown={onKeyDown}
              disabled={!selected || isSending}
              rows={1}
            />
            <button
              className="rounded-xl px-4 h-11 bg-slate-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={send}
              disabled={!selected || !input.trim() || isSending}
            >
              送信
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>ショートカット: ⌘/Ctrl + Enter で送信</span>
            {selected && <span>現在のペルソナ: {selected.persona}</span>}
          </div>
        </div>
    </>
  )
}