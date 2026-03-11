"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function AdminPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData || JSON.parse(userData).role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const logsData = await fetchAPI('/logs');
      setLogs(logsData);
      const usersData = await fetchAPI('/users');
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div></div>;

  return (
    <main className="min-h-screen p-8 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between glass p-6 rounded-2xl border-indigo-500/20">
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">Admin Control Center</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Manage users and view system activity logs securely</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold rounded-xl transition-all border border-indigo-500/30">
            Back to Dashboard
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <section className="glass p-6 rounded-2xl flex flex-col h-[600px]">
            <h2 className="text-xl font-bold text-white mb-6 sticky">User Management</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-indigo-500/30">
              {users.map(u => (
                <div key={u.user_id} className="p-4 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between hover:border-pink-500/30 transition-colors">
                  <div>
                    <h3 className="text-white font-bold">{u.name} <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-black tracking-wider rounded-md bg-white/5 text-slate-300 border border-white/10">{u.role}</span></h3>
                    <p className="text-xs text-slate-400 mt-1">{u.email}</p>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">ID: {u.user_id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold rounded-lg transition-colors border border-indigo-500/20">Edit Role</button>
                    {u.role !== 'admin' && (
                      <button className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold rounded-lg transition-colors border border-red-500/20">Deactivate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* System Logs */}
          <section className="glass p-6 rounded-2xl flex flex-col h-[600px]">
             <h2 className="text-xl font-bold text-white mb-6 sticky">Activity Logs</h2>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-indigo-500/30">
               {logs.map(lg => (
                 <div key={lg.log_id} className="p-4 bg-slate-900 border border-white/5 rounded-xl shrink-0 flex items-start gap-4">
                   <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0 mt-0.5">
                     <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <div className="flex-1">
                     <p className="text-sm font-semibold text-slate-200">{lg.action}</p>
                     <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                       <span>{lg.user_name}</span>
                       <span>{new Date(lg.timestamp).toLocaleString()}</span>
                     </div>
                   </div>
                 </div>
               ))}
               {logs.length === 0 && <p className="text-center text-slate-500 py-10">No logs found.</p>}
             </div>
          </section>
        </div>

      </div>
    </main>
  );
}
