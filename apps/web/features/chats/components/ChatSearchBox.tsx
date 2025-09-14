
export const ChatSearchBox: React.FC<{
  sidebarQuery: string
  setSidebarQuery: (query: string) => void
}> = ({ sidebarQuery, setSidebarQuery }) => {
  return (
    <>
      {/* Search */}
      <div className="p-3 border-b">
        <label htmlFor="chat-search" className="sr-only">検索</label>
        <input
          id="chat-search"
            className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="タイトルや内容で検索"
            value={sidebarQuery}
            onChange={(e) => setSidebarQuery(e.target.value)}
          />
        </div>
    </>
  )
}
