// app/api/auth/[...nextauth]/route.ts
import { ENV } from "@/config/env"
import NextAuth, { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: ENV.discord.id,
            clientSecret: ENV.discord.secret,
            authorization: { params: { scope: "identify email guilds" } },
        }),
    ],
    callbacks: {
        async signIn({ account, user }) {
            if (!account?.providerAccountId) return false
            user.discordId = account.providerAccountId
            const adminIds = process.env.ADMIN_IDS?.split(",") || []
            user.role = adminIds.includes(user.discordId) ? "admin" : "user"
            return true
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub || "",
                    role: (token.role as "admin" | "user") || "user", // <-- แก้ตรงนี้
                    discordId: token.discordId || "",
                }
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.discordId = user.discordId
            }
            return token
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }