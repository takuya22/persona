
export const Footer: React.FC<{}> = () => {
  return (
    <>
        {/* Footer */}
        <div className="h-11 border-t text-[11px] text-slate-500 px-3 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Persona Interview</span>
          <a href="#" className="hover:text-slate-900">設定</a>
        </div>
    </>
  )
}
