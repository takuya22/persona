import { Role } from "../types/chats.types";

export const Avatar: React.FC<{ role: Role; }> = ({ role }) => {
  const base = "size-7 rounded-xl grid place-items-center text-xs font-bold text-white";
  if (role === "user") return <div className={`${base} bg-slate-900`}>You</div>;
  if (role === "assistant") return <div className={`${base} bg-indigo-600`}>AI</div>;
  return <div className={`${base} bg-slate-400`}>Sy</div>;
}
