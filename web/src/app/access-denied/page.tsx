// app/access-denied/page.tsx
'use client';

import Link from 'next/link';

export default function AccessDenied() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-red-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-xl border border-red-100 max-w-md text-center">
                <h1 className="text-2xl font-bold text-red-900 mb-4">⚠️ Access Denied</h1>
                <p className="text-red-700 mb-6">
                    You don&apos;t have permission to access this page.
                </p>
                <Link
                    href="/"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}