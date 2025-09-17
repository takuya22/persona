import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SignIn from "@/features/auth/components/SignIn"
import { SignOut } from "@/features/auth/components/SignOut"
import { useSession } from "next-auth/react"


export const Header: React.FC<{
}> = () => {
  const { data: session } = useSession()
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/60 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-2xl bg-slate-900 text-white grid place-items-center font-bold">Pi</div>
            <span className="font-semibold tracking-tight">Persona Interview</span>
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#personas" className="hover:text-slate-900">Personas</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            {/* <Button variant="ghost" className="hidden sm:inline-flex">ログイン</Button> */}
            {!session ? (
              <>
                <SignIn />
                {/* <Button className="rounded-2xl">無料で試す</Button> */}
              </>
            ) : (
              <SignOut />
            )}
          </div>
        </div>
      </header>
    </>
  )
}
