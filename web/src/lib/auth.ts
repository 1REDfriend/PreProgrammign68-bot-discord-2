import { ENV } from "@/config/env";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import type { DefaultSession, Account, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// ขยายประเภทของ Session และ User
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role: string;
            discordId: string;
        } & DefaultSession["user"];
    }

    interface User {
        discordId?: string;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        discordId?: string;
        role?: string;
    }
}

export const authConfig = {
    providers: [
        Discord({
            clientId: ENV.discord.id,
            clientSecret: ENV.discord.secret,
            authorization: { params: { scope: "identify email guilds" } }
        }),
    ],
    callbacks: {
        async signIn({ account, user }: { account: Account | null; user: User }) {
            if (!account?.providerAccountId) return false;

            user.discordId = account.providerAccountId;
            const adminIds = process.env.ADMIN_IDS?.split(",") || [];
            user.role = adminIds.includes(user.discordId) ? "admin" : "user";

            return true;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            session.user.id = token.sub!;
            session.user.role = token.role!;
            session.user.discordId = token.discordId!;
            return session;
        },
        async jwt({ token, user }: { token: JWT; user?: User }) {
            if (user) {
                token.role = user.role;
                token.discordId = user.discordId;
            }
            return token;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);