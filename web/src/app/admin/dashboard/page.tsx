// app/admin/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function Dashboard() {
    const { data: session } = useSession();

    if (!session?.user) {
        redirect('/admin/login');
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-red-50">
            <nav className="bg-white/80 backdrop-blur-md border-b border-red-100">
                {/* Navigation */}
            </nav>

            <main className="container mx-auto p-6">
                <h1 className="text-3xl font-bold text-red-900 mb-8">
                    Welcome, {session.user.name}!
                </h1>

                {/* Admin Dashboard Content */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100">
                    <h2 className="text-xl font-semibold text-red-800 mb-4">
                        Server Statistics
                    </h2>
                    {/* เพิ่มเนื้อหาดาต้าเบอร์ด */}
                </div>
            </main>
        </div>
    );
}