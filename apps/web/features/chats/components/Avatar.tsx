import { getPersonaRoleByAuthor } from "@/features/persona/utils/persona";
import { Role } from "../types/chats.types";

function abbreviate(label: string, max: number) {
  if (label.length <= max) return label;
  return label.slice(0, max) + "…";
}

export const Avatar: React.FC<{
  role: Role;
  author?: string;
  maxChars?: number;      // 省略前の最大文字数 (デフォルト: 10)
  full?: boolean;         // true なら省略せず全表示
}> = ({ role, author, maxChars = 10, full = false }) => {
  const base =
    "h-7 min-w-7 inline-flex items-center justify-center rounded-md px-2 text-[11px] font-semibold leading-none text-white";
  if (role === "user") {
    return <div className={`${base} bg-slate-900`} title="You">You</div>;
  }

  const raw = getPersonaRoleByAuthor(author ?? "") || "AI";
  const shown = full ? raw : abbreviate(raw, maxChars);

  return (
    <div
      className={`${base} bg-indigo-600 max-w-[120px] whitespace-nowrap overflow-hidden`}
      title={raw}
    >
      {shown}
    </div>
  );
};