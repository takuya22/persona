import { useRouter } from "next/navigation";

export const SideHeader: React.FC<{
  createChat: () => Promise<void>;
}> = ({ createChat }) => {
  const router = useRouter();
  return (
    <>
      {/* Brand + New Chat */}
    <div className="sticky top-0 z-10 bg-white">
      <div className="w-[299px] h-14 px-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')} role="button">
          <div className="size-7 rounded-xl bg-slate-900 text-white grid place-items-center text-xs font-bold">Pi</div>
          <span className="text-sm font-semibold">Persona Interview</span>
        </div>
        <button
          className="text-sm px-2 h-8 rounded-md bg-slate-900 text-white hover:opacity-90"
          onClick={createChat}
          aria-label="新しいチャットを作成"
        >
          新規
        </button>
      </div>
    </div>
    </>
  )
}
