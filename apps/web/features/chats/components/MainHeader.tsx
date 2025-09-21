import { Chat } from "../types/chats.types"

export const MainHeader: React.FC<{
  selected: Chat | null,
  // switchPersona: (persona: string) => void
// }> = ({ selected, switchPersona }) => {
}> = ({ selected }) => {
  return (
    <>
        {/* Header */}
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center px-2 h-6 rounded-full border border-slate-200 text-xs text-slate-600">
              {selected?.persona || "-"}
            </span>
            <h2 className="text-sm font-semibold truncate">{selected?.title || "チャット未選択"}</h2>
          </div>
          {/* Persona switcher */}
          {/* {selected && (
            <div className="flex items-center gap-2">
                {(["PM", "Design", "Engineer", "Marketing", "Sales", "HR"] as const).map((p) => (
                <button
                    key={p}
                    className={`px-2 h-7 rounded-full border text-xs whitespace-nowrap hover:bg-slate-50 ${
                    selected.persona === p ? "border-slate-900" : "border-slate-200"
                    }`}
                    onClick={() => switchPersona(p)}
                    aria-pressed={selected.persona === p}
                >
                    {p}
                </button>
                ))}
            </div>
          )} */}
        </div>
    </>
  )
}
