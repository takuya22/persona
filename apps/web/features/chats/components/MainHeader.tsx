import { getPersonaRoleById } from "@/features/persona/utils/persona"
import { Chat } from "../types/chats.types"

export const MainHeader: React.FC<{
  selected: Chat | null,
  // switchPersona: (persona: string) => void
// }> = ({ selected, switchPersona }) => {
}> = ({ selected }) => {
  return (
    <>
        {/* Header */}
        <div className="sticky top-0 z-10 h-14 border-b px-4 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center px-2 h-6 rounded-full border border-slate-200 text-xs text-slate-600">
              {selected ? getPersonaRoleById(selected.role) : "-"}
            </span>
            <h2 className="text-sm font-semibold truncate">{selected?.title || "チャット未選択"}</h2>
          </div>
        </div>
    </>
  )
}
