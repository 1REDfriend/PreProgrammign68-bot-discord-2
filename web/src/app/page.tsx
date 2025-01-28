import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-red-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-red-100 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-600 rounded-full animate-pulse" />
              <span className="ml-3 text-2xl font-bold text-red-800">SpellBound 68&apos;s</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-red-700 hover:text-red-900 transition">Features</a>
              <a href="#" className="text-red-700 hover:text-red-900 transition">Documentation</a>
              <div className="flex space-x-4">
                <Link href={'/admin/login'} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition shadow-sm">
                  Admin Login
                </Link>
                <Link href={'#'} className="bg-white hover:bg-red-50 text-red-600 px-6 py-2 rounded-lg transition border border-red-200 shadow-sm">
                  User Login
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-red-900 mb-6 leading-tight">
            PrePro-68 bot<br />Discord Server
            </h1>
            <p className="text-red-700 text-xl mb-8">
              Advanced bot, Full feature and easy to use.
            </p>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
              <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg transition transform hover:scale-105 shadow-lg">
                Get Started - It&apos;s Free
              </button>
              <button className="border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-4 rounded-xl text-lg transition">
                Documentation
              </button>
            </div>
          </div>

          <div className="md:w-1/2 mt-12 md:mt-0">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-0 bg-red-100 rounded-full" />
              <div className="relative bg-white p-1 rounded-2xl shadow-2xl border border-red-100">
                <div className="bg-white rounded-xl p-4">
                  <div className="animate-float">
                    {/* Replace with actual bot screenshot */}
                    <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center border-2 border-dashed border-red-200">
                      <Image className="p-6 rounded-lg" src={'/Image/landing/botpreview.png'} alt={"preview"} fill />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-red-900 text-center mb-16">Key Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {['Advanced Moderation', 'Entertainment', 'Server Management'].map((feature) => (
              <div key={feature} className="bg-white p-8 rounded-xl hover:shadow-lg transition-all border border-red-100">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-red-900 mb-4">{feature}</h3>
                <p className="text-red-700">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.</p>
              </div>
            ))}
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
            {['Discord', 'Twitter', 'GitHub'].map((social) => (
              <a key={social} href="#" className="text-red-200 hover:text-white transition">
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
