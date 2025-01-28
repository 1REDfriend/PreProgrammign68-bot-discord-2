// app/admin/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { FaChartBar, FaUsers, FaServer, FaCog } from 'react-icons/fa';

export default function Dashboard() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/admin/login');
        }
    }, [status]);

    if (status === 'loading' || !session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="animate-pulse text-red-700">Loading Dashboard...</div>
            </div>
        );
    }

    // Sample data for demonstration
    const stats = [
        { title: "Total Servers", value: "1", icon: <FaServer className="w-8 h-8" /> },
        { title: "Active Users", value: "1k", icon: <FaUsers className="w-8 h-8" /> },
        { title: "Commands Used", value: "0.001M", icon: <FaCog className="w-8 h-8" /> },
        { title: "Uptime", value: "99.9%", icon: <FaChartBar className="w-8 h-8" /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-red-50">
            {/* Navigation Bar */}
            <nav className="bg-white/90 backdrop-blur-md border-b border-red-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-red-900">Admin Dashboard</h2>
                </div>
                <div className="flex items-center space-x-6">
                    <button className="text-red-700 hover:text-red-900 flex items-center">
                        <FaUsers className="w-5 h-5 mr-2" />
                        Manage Users
                    </button>
                    <button className="text-red-700 hover:text-red-900 flex items-center">
                        <FaCog className="w-5 h-5 mr-2" />
                        Settings
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto p-8">
                {/* Welcome Header */}
                <div className="mb-10 flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-red-900">
                        Welcome back, <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">{session.user.name}</span>
                    </h1>
                    <div className="relative w-16 h-16">
                        <Image
                            src={session.user.image || '/default-avatar.png'}
                            alt="User Avatar"
                            fill
                            className="rounded-full border-2 border-red-200"
                        />
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-red-50 group"
                        >
                            <div className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <p className="text-gray-500 text-sm">{item.title}</p>
                                    <p className="text-3xl font-bold text-red-900">{item.value}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-100 transition-colors">
                                    {item.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Activity Chart Section */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100">
                    <h2 className="text-2xl font-semibold text-red-900 mb-6">Server Activity</h2>
                    <div className="h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                        <Image
                            src="/activity-chart-placeholder.png"
                            alt="Activity Chart"
                            width={1200}
                            height={400}
                            className="object-cover h-full w-full rounded-lg"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}