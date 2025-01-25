export const ENV = {
    discord: {
        id: process.env.DISCORD_CLIENT_ID!,
        secret: process.env.DISCORD_CLIENT_SECRET!,
        admin_id: process.env.ADMIN_IDS!
    },
    next: {
        secret: process.env.NEXTAUTH_SECRET!,
        url: process.env.NEXTAUTH_URL!
    }
}