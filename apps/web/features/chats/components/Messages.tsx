import { Avatar } from "@/components/ui/avatar";
import { MessageBubble } from "./MessageBubble";

export const Messages: React.FC<{
  streamRef: React.RefObject<HTMLDivElement | null>;
  selected: Chat | null;
  isTyping: boolean;
}> = ({ streamRef, selected, isTyping }) => {
  return (
    <>
      {/* Messages */}
      <div ref={streamRef} className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {!selected ? (
          <div className="h-full grid place-items-center text-slate-500">
            チャットを選択してください
          </div>
        ) : (
          <div className="space-y-4">
            {selected.messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
            ))}
            {isTyping && (
              <div className="flex items-start gap-2">
                <Avatar role="assistant" />
                <div className="px-3 py-2 rounded-2xl rounded-tl-none bg-slate-100 text-sm text-slate-800">
                  <span className="inline-flex items-center gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse [animation-delay:150ms]">●</span>
                    <span className="animate-pulse [animation-delay:300ms]">●</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
