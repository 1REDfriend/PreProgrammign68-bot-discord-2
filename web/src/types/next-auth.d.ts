// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    discordId?: string
    role?: string
  }

  interface Session {
    user: {
      id?: string
      role?: string
      discordId?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    discordId?: string
  }
}