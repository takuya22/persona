
"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
 
export default function SignIn() {
  return <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => signIn("google")}>ログイン</Button>
}
