import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 glass p-16 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 pb-2">
          SecureVault
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
          Military-grade AES-256 cloud storage. Your files, fully encrypted, with granular role-based access control.
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/login" 
            className="group relative px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,1)] overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              Start Free Trial
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link href="/register" 
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold text-lg backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-105">
            Create Account
          </Link>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { title: "AES-256 Encryption", desc: "Every file is encrypted locally before hitting the database." },
            { title: "Granular RBAC", desc: "Admin, User, and Viewer roles govern every action." },
            { title: "Zero Trust", desc: "A strict zero-trust architecture keeping external actors out." },
          ].map((feat, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-colors duration-300">
              <h3 className="text-lg font-bold text-indigo-300 mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
