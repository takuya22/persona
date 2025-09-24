// import { Avatar } from "@radix-ui/react-avatar";
import { Role } from "../types/chats.types";
import { Avatar } from "./Avatar";

const renderContent = (text: string) => {
  const parts: (string | { bold: string })[] = [];
  let lastIndex = 0;
  const regex = /\*\*(.+?)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ bold: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <strong key={i} className="font-semibold">
        {p.bold}
      </strong>
    )
  );
};

export const MessageBubble: React.FC<{ role: Role; content: string; author?: string; createdAt: string }> = ({ role, content, author, createdAt }) => {
  const isUser = role === "user";
  return (
    <div className={`flex items-start gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Avatar role={role} author={author} />}
      <div className={`max-w-[80%] md:max-w-[70%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
        isUser ? "bg-slate-900 text-white rounded-tr-none" : role === "assistant" ? "bg-slate-100 text-slate-900 rounded-tl-none" : "bg-slate-200 text-slate-800 rounded-tl-none"
      }`}>
        {renderContent(content)}
        <div className={`mt-1 text-[10px] ${isUser ? "text-slate-300" : "text-slate-500"}`}>{createdAt}</div>
      </div>
      {isUser && <Avatar role={role} />}
    </div>
  );
}