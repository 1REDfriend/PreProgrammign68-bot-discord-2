// app/admin/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Head from 'next/head';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await signIn('discord', { redirect: false });
            if (result?.error) {
                setError('Login failed. Please check your permissions and try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.'+err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isLoading) {
                handleLogin();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isLoading]);

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            </Head>

            <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-white to-red-50">
                {/* Navigation */}
                <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-red-100 z-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-8 w-8 bg-red-600 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
                                <span className="ml-3 text-2xl font-bold text-red-800">DiscordBot Admin</span>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Login Section */}
                <section className="pt-32 pb-20 container mx-auto px-4 sm:px-6">
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-red-100 p-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-red-900 mb-4">Admin Login</h1>
                            <p className="text-red-700 mb-8">Please login with your Discord account</p>

                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                aria-disabled={isLoading}
                                className={`w-full bg-[#5865F2] hover:bg-[#4752c4] text-white px-6 py-4 rounded-xl
                  transition-transform transform hover:scale-105 flex items-center justify-center
                  space-x-3 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    'Logging in...'
                                ) : (
                                    <>
                                        <svg
                                            className="w-6 h-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
                                        </svg>
                                        <span>Login with Discord</span>
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
                                <h3 className="text-red-900 font-semibold mb-2">⚠️ Admin Access Only</h3>
                                <p className="text-red-700 text-sm">
                                    Only authorized Discord accounts with admin privileges
                                    will be able to access the dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-red-900 py-12">
                    <div className="container mx-auto px-6 text-center">
                        <div className="text-red-100 mb-8">
                            © 2024 DiscordBot. All rights reserved.
                        </div>
                        <div className="flex justify-center space-x-6">
                            {[
                                { name: 'Discord', url: 'https://discord.gg/your-invite-link' },
                                { name: 'Twitter', url: 'https://twitter.com/your-handle' },
                                { name: 'GitHub', url: 'https://github.com/your-repo' }
                            ].map((social) => (
                                <button
                                    key={social.name}
                                    onClick={() => window.open(social.url, '_blank')}
                                    className="text-red-200 hover:text-white transition hover:underline"
                                    aria-label={`Visit our ${social.name} page`}
                                >
                                    {social.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}