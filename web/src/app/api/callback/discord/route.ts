// app/api/callback/discord/route.ts
import { ENV } from '@/config/env';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 1. ดึง Authorization Code จาก URL
        const code = request.nextUrl.searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: 'Missing authorization code' },
                { status: 400 }
            );
        }

        // 2. แลกเปลี่ยน Code เป็น Access Token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: ENV.discord.id,
                client_secret: ENV.discord.secret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${window.location.href}/callback/discord`,
                scope: 'identify email',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error_description);
        }

        // 3. ดึงข้อมูลผู้ใช้จาก Discord API
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();

        // 4. Redirect ไปยังหน้าหลักหรือจัดการ Session (ตัวอย่าง redirect)
        const response = NextResponse.redirect(new URL('/', request.url));

        // 5. บันทึกข้อมูลผู้ใช้ใน Cookie (ตัวอย่างเท่านั้น)
        response.cookies.set('discord_user', JSON.stringify(userData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        return response;

    } catch (error) {
        console.error('Discord OAuth Error:', error);
        return NextResponse.json(
            { error: error || 'Authentication failed' },
            { status: 500 }
        );
    }
}