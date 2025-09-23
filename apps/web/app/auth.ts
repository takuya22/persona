import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // console.log("JWT callback:", { token, account, profile })
      if (account && profile) {
        token.googleId = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      if (token.googleId) {
        session.user.id = token.googleId as string
      }
      // console.log("Session callback:", { session, token })
      return session
    }
  }
})