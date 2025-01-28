import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-red-50">
            {/* Navigation - เหมือนเดิมเพื่อความสม่ำเสมอ */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-red-100 z-50">
                {/* ...โค้ด Navigation เดิมเหมือนหน้าหลัก... */}
            </nav>

            {/* 404 Content */}
            <section className="pt-32 pb-20 container mx-auto px-6 min-h-screen flex items-center">
                <div className="flex flex-col md:flex-row items-center justify-between w-full">
                    {/* Text Content */}
                    <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
                        <div className="relative inline-block">
                            <h1 className="text-9xl font-bold text-red-600 mb-4 relative z-10">
                                404
                                <span className="absolute -right-8 -top-4 text-4xl bg-red-100 px-4 py-2 rounded-full animate-pulse">
                                    Oops!
                                </span>
                            </h1>
                        </div>
                        <h2 className="text-4xl font-bold text-red-900 mb-6">
                            Page Lost in Space
                        </h2>
                        <p className="text-xl text-red-700 mb-8 max-w-md">
                            The page you&apos;re looking for seems to have drifted off into the
                            digital cosmos. Let&apos;s get you back to safety.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link
                                href="/"
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg transition transform hover:scale-105 shadow-lg flex items-center justify-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                                Return Home
                            </Link>
                        </div>
                    </div>

                    {/* Illustration */}
                    <div className="md:w-1/2 relative max-w-xl">
                        <div className="relative bg-white p-1 rounded-2xl shadow-2xl border border-red-100 transform rotate-2">
                            <div className="bg-white rounded-xl p-4 overflow-hidden">
                                <div className="animate-float">
                                    <Image
                                        src="/Image/404-astronaut.jpg" // เปลี่ยนเป็นภาพ 404 illustration ของคุณ
                                        alt="404 Astronaut"
                                        width={600}
                                        height={600}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-50/50 mix-blend-multiply" />
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-red-100 rounded-full opacity-50 animate-pulse" />
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200 rounded-full opacity-30 animate-pulse delay-300" />
                    </div>
                </div>
            </section>

            {/* Footer - เหมือนเดิมเพื่อความสม่ำเสมอ */}
            <footer className="bg-red-900 py-12">
                {/* ...โค้ด Footer เดิมเหมือนหน้าหลัก... */}
            </footer>
        </div>
    );
}