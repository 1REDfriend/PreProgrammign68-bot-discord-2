// app/admin/dashboard/page.tsx
'use client'
import { signOut, useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { FaChartBar, FaUsers, FaServer, FaCog, FaChevronDown, FaSignOutAlt } from 'react-icons/fa'
import { DateTime } from 'next-auth/providers/kakao'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

interface IRecord { create_at: string }
interface IDataSet { label: string, data: number[], borderColor: string, backgroundColor: string }
interface IChartData { labels: string[], datasets: IDataSet[] }
interface IUserLog {id:number, user_id: string, username: string, server_id: string , action: string, channel_id: string,status: string, message_content: string, timesamp: DateTime }

export default function Dashboard() {
    const { data: session, status } = useSession()
    const [showDropdown, setShowDropdown] = useState(false)
    const [chartData, setChartData] = useState<IChartData>({ labels: [], datasets: [] })
    const [tableData, setTableData] = useState<IUserLog[]>([])

    useEffect(() => {
        if (status === 'unauthenticated') redirect('/admin/login')
    }, [status])

    useEffect(() => {
        fetch('/api/getData')
            .then(r => r.json())
            .then((raw: IRecord[]) => {
                const sorted = raw.sort((a, b) => new Date(a.create_at).getTime() - new Date(b.create_at).getTime())
                if (!sorted.length) return
                const step = 5 * 60 * 1000
                const start = new Date(sorted[0].create_at).getTime()
                const end = new Date(sorted[sorted.length - 1].create_at).getTime()
                const labels: string[] = []
                const dataArr: number[] = []
                for (let t = start; t <= end; t += step) {
                    const dateString = new Date(t).toLocaleString()
                    labels.push(dateString)
                    const online = sorted.some(s => {
                        const diff = Math.abs(new Date(s.create_at).getTime() - t)
                        return diff < step
                    })
                    dataArr.push(online ? 1 : 0)
                }
                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Online 1 / Offline 0',
                            data: dataArr,
                            borderColor: 'rgb(239 68 68)',
                            backgroundColor: 'rgb(239 68 68)'
                        }
                    ]
                })
            })
        fetch('/api/user-logs')
            .then(r => r.json())
            .then((d: IUserLog[]) => setTableData(d))
    }, [])

    if (status === 'loading' || !session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="animate-pulse text-red-700">Loading Dashboard...</div>
            </div>
        )
    }

    const stats = [
        { title: "Total Servers", value: "1", icon: <FaServer className="w-8 h-8" /> },
        { title: "Active Users", value: "1k", icon: <FaUsers className="w-8 h-8" /> },
        { title: "Commands Used", value: "0.001M", icon: <FaCog className="w-8 h-8" /> },
        { title: "Uptime", value: "99.9%", icon: <FaChartBar className="w-8 h-8" /> },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-red-50">
            <nav className="bg-white/90 backdrop-blur-md border-b border-red-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-red-900">Admin Dashboard</h2>
                </div>
                <div className="flex items-center space-x-6">
                    <button className="text-red-700 hover:text-red-900 flex items-center">
                        <FaUsers className="w-5 h-5 mr-2" />
                        Manage Users
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowDropdown(!showDropdown)} className="text-red-700 hover:text-red-900 flex items-center">
                            <FaCog className="w-5 h-5 mr-2" />
                            Settings
                            <FaChevronDown className={`w-4 h-4 ml-2 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-red-100">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                                    className="w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center"
                                >
                                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            <main className="container mx-auto p-8">
                <div className="mb-10 flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-red-900">
                        Welcome back, <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">{session.user.name}</span>
                    </h1>
                    <div className="relative w-16 h-16">
                        <Image src={session.user.image || '/default-avatar.png'} alt="User Avatar" fill className="rounded-full border-2 border-red-200" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-red-50 group">
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
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100">
                    <h2 className="text-2xl font-semibold text-red-900 mb-6">Server Activity</h2>
                    <div className="h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 mt-6">
                    <h2 className="text-2xl font-semibold text-red-900 mb-6">User Logs</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                                    <th className="py-3 px-4 text-left">Id</th>
                                    <th className="py-3 px-4 text-left">User ID</th>
                                    <th className="py-3 px-4 text-left">Username</th>
                                    <th className="py-3 px-4 text-left">Server ID</th>
                                    <th className="py-3 px-4 text-left">Channel ID</th>
                                    <th className="py-3 px-4 text-left">Action</th>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    <th className="py-3 px-4 text-left">Message Content</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="odd:bg-red-50 even:bg-white hover:bg-red-100 transition-colors cursor-pointer"
                                        onClick={() => alert(`Clicked: ${row.username}`)}
                                    >
                                        <td className="py-2 px-4">{row.id}</td>
                                        <td className="py-2 px-4">{row.username}</td>
                                        <td className="py-2 px-4">{row.user_id}</td>
                                        <td className="py-2 px-4">{row.server_id}</td>
                                        <td className="py-2 px-4">{row.channel_id}</td>
                                        <td className="py-2 px-4">{row.action}</td>
                                        <td className="py-2 px-4">{row.status}</td>
                                        <td className="py-2 px-4">{row.message_content}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
