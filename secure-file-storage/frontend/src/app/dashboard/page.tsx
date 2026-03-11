"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, API_URL } from '@/lib/api';

export default function Dashboard() {
  const [files, setFiles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Share modal state
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [shareFileName, setShareFileName] = useState('');
  const [shareUserId, setShareUserId] = useState('');
  const [sharePerm, setSharePerm] = useState('view');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  
  // All users for the picker (admin only; regular users see a manual UUID input as fallback)
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadFiles();
    // Load users list for the share picker
    loadUsers();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await fetchAPI('/files');
      setFiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchAPI('/users');
      setAllUsers(data);
    } catch {
      // non-admins won't have access — that's fine
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        await loadFiles();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/download/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  const openShareModal = (fileId: string, fileName: string) => {
    setShareFileId(fileId);
    setShareFileName(fileName);
    setShareUserId('');
    setUserSearch('');
    setSharePerm('view');
    setShareStatus(null);
  };

  const handleShare = async () => {
    if (!shareUserId) {
      setShareStatus({ type: 'error', msg: 'Please select a user to share with.' });
      return;
    }
    setShareLoading(true);
    setShareStatus(null);
    try {
      await fetchAPI('/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: shareFileId, user_id: shareUserId, permission_type: sharePerm })
      });
      setShareStatus({ type: 'success', msg: 'Access granted successfully! 🎉' });
      setTimeout(() => setShareFileId(null), 1800);
    } catch (err: any) {
      setShareStatus({ type: 'error', msg: err.message || 'Share failed. Please try again.' });
    } finally {
      setShareLoading(false);
    }
  };

  // Filter the user list (exclude yourself)
  const filteredUsers = allUsers.filter(u =>
    u.user_id !== user?.user_id &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <main className="min-h-screen p-8 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between glass p-6 rounded-2xl">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">SecureVault Dashboard</h1>
            <p className="text-slate-400 text-sm mt-0.5">Welcome back, <span className="text-white font-medium">{user?.name}</span> <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">{user?.role}</span></p>
          </div>
          <div className="flex gap-4">
            {user?.role === 'admin' && (
              <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors border border-indigo-500/20 font-medium text-sm">
                Admin Panel
              </button>
            )}
            <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm">
              Logout
            </button>
          </div>
        </header>

        {/* Upload Zone */}
        {user?.role !== 'viewer' && (
          <section
            className={`glass p-8 rounded-2xl text-center border-dashed border-2 transition-all duration-300 cursor-pointer relative group ${uploadSuccess ? 'border-green-500/60 bg-green-500/5' : 'border-indigo-500/30 hover:border-indigo-500/60'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <div className="flex flex-col items-center justify-center gap-3">
              {uploadSuccess ? (
                <>
                  <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-green-300">Encrypted & Stored!</h3>
                  <p className="text-slate-400 text-sm">Your file was encrypted with AES-256 and saved securely.</p>
                </>
              ) : (
                <>
                  <svg className={`w-12 h-12 text-indigo-400 transition-transform ${uploading ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-xl font-bold text-slate-200">{uploading ? 'Encrypting & Uploading...' : 'Upload File'}</h3>
                  <p className="text-slate-400 text-sm">Click to browse. Files are AES-256 encrypted before storage.</p>
                </>
              )}
            </div>
          </section>
        )}

        {/* File List */}
        <section className="glass p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Your Files
            <span className="ml-2 text-xs font-normal text-slate-500">({files.length} file{files.length !== 1 ? 's' : ''})</span>
          </h2>
          {files.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-black/20 rounded-xl">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">No files yet. Upload your first encrypted file above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map(f => (
                <div key={f.file_id} className="p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-white font-medium truncate text-sm" title={f.file_name}>{f.file_name}</p>
                      <p className="text-xs text-slate-500">{new Date(f.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(f.file_id, f.file_name)}
                      className="flex-1 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                    </button>
                    {(user.role === 'admin' || f.owner_id === user.user_id) && (
                      <button
                        onClick={() => openShareModal(f.file_id, f.file_name)}
                        className="flex-1 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Share
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Share Modal */}
        {shareFileId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => { if (e.target === e.currentTarget) setShareFileId(null); }}>
            <div className="glass p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Share File Access</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs" title={shareFileName}>📄 {shareFileName}</p>
                </div>
                <button onClick={() => setShareFileId(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* User Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select User</label>
                  {allUsers.length > 0 ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {filteredUsers.length === 0 ? (
                          <p className="text-slate-500 text-xs text-center py-3">No users found.</p>
                        ) : (
                          filteredUsers.map(u => (
                            <button
                              key={u.user_id}
                              onClick={() => setShareUserId(u.user_id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${shareUserId === u.user_id ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-black/20 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10'}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${shareUserId === u.user_id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate">{u.name}</p>
                                <p className="text-xs text-slate-500 truncate">{u.email} · <span className="capitalize">{u.role}</span></p>
                              </div>
                              {shareUserId === u.user_id && (
                                <svg className="w-4 h-4 text-indigo-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Fallback for non-admin users who can't fetch all users */
                    <input
                      placeholder="Paste User ID (UUID)..."
                      value={shareUserId}
                      onChange={e => setShareUserId(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600 transition-all font-mono"
                    />
                  )}
                </div>

                {/* Permission Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Permission Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'view', label: 'View & Download', icon: '👁️' },
                      { value: 'edit', label: 'Full Edit Access', icon: '✏️' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSharePerm(opt.value)}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all text-left ${sharePerm === opt.value ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
                      >
                        <span className="text-lg block mb-1">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status feedback */}
                {shareStatus && (
                  <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${shareStatus.type === 'success' ? 'bg-green-500/15 text-green-300 border border-green-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
                    {shareStatus.type === 'success' ? '✓' : '⚠'} {shareStatus.msg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShareFileId(null)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading || !shareUserId}
                    className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
                  >
                    {shareLoading ? 'Sharing...' : 'Grant Access'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
