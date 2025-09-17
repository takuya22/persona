"use client"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
 
export function SignOut() {
  const { data: session } = useSession()
  return <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => signOut()}>ログアウト</Button>
}