import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const logs = await prisma.userLog.findMany({
        orderBy: {
            id: 'desc'
        },
        take: 100
    })
    return NextResponse.json(logs)
}