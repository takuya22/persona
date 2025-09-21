import { Chat } from "../types/chats.types";
import { timeAgo } from "../utils/chats";

export const ChatList: React.FC<{
  filtered: Chat[],
  selectedId: string | null,
  setSelectedId: (id: string) => void,
  renameChat: (id: string, newTitle: string) => void,
  removeChat: (id: string) => void,
}> = ({ filtered, selectedId, setSelectedId, renameChat, removeChat }) => {
  return (
    <>
        {/* Chat list */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 p-4">該当するチャットがありません。</p>
          ) : (
            <ul className="py-2">
            {filtered.map((c) => (
                <li key={c.sessionId}>
                <div className="relative group">
                    <button
                    onClick={() => setSelectedId(c.sessionId)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 ${
                        selectedId === c.sessionId ? "bg-slate-100" : ""
                    }`}
                    aria-current={selectedId === c.sessionId ? "page" : undefined}
                    >
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 h-5 rounded-full border border-slate-200 text-[11px] text-slate-600">
                            {c.persona}
                            </span>
                            <input
                            className="bg-transparent text-sm font-medium outline-none min-w-0 w-full focus:ring-1 focus:ring-slate-300 rounded px-1"
                            value={c.title}
                            onChange={(e) => renameChat(c.sessionId, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="チャットタイトルを編集"
                            />
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                            {c.firstMessage || "(メッセージなし)"}
                        </p>
                        </div>
                        <span className="text-[11px] text-slate-400">{timeAgo(c.updatedAt)}</span>
                    </div>
                    </button>
                    <button
                    className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("このチャットを削除しますか？")) removeChat(c.sessionId);
                    }}
                    aria-label="チャットを削除"
                    >
                    ✕
                    </button>
                </div>
                </li>
            ))}
            </ul>
          )}
        </div>
    </>
  )
}
