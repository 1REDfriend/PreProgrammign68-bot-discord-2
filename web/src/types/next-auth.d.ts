// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    discordId?: string;
  }

  interface Session {
    user: User;
  }
}