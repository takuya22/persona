
"use client"

import { Button } from "@/components/ui/button"
import { signIn, useSession } from "next-auth/react"
 
export default function SignIn() {
  const { data: session } = useSession()
  console.log("Session:", session)
  return <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => signIn("google")}>ログイン</Button>
}
