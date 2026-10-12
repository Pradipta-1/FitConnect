'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

interface ProfileModalProps {
  userId: string;
  onClose: () => void;
}

    interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  highestStreak: number;
  clientCount?: number;
  clientHighestStreak?: number;
}

export default function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const [targetRes, meRes] = await Promise.all([
          apiFetch(`/api/users/${userId}`),
          apiFetch('/api/auth/me')
        ]);
        
        const targetData = await targetRes.json();
        const meData = await meRes.json();
        
        if (targetData.success) setUser(targetData.data);
        if (meData.success) setCurrentUser(meData.data);
      } catch (err) {
        console.error('Failed to fetch profiles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [userId]);

  const handleDelete = async () => {
    if (!user || confirmName !== user.name || confirmPhrase.toLowerCase() !== 'I want to delete my account'.toLowerCase()) return;
    
    setDeleting(true);
    try {
      const res = await apiFetch('/api/auth/me', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/'; // Logout and redirect
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (err) {
      alert('Error deleting account');
    } finally {
      setDeleting(false);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#090e0c] border border-emerald-500/20 rounded-3xl shadow-2xl relative overflow-hidden group">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-500/20 to-brand-primary/20" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#090e0c]/60 text-slate-400 hover:text-white hover:bg-[#121c17] transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="pt-12 pb-8 px-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-[#090e0c] overflow-hidden bg-[#121c17] shadow-xl">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-emerald-400">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : user ? (
            <>
              <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
              <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-6">
                {user.role}
              </p>

              <div className="w-full space-y-3">
                {user.role !== 'TRAINER' && (
                  <div className="bg-[#0d1411] border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Streak</p>
                        <p className="text-white font-mono font-bold text-lg">{user.highestStreak} Days</p>
                      </div>
                    </div>
                    {user.highestStreak >= 5 && <span className="text-xl">🔥</span>}
                  </div>
                )}

                {user.role === 'TRAINER' && typeof user.clientCount === 'number' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🤝</span>
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-500/60 uppercase tracking-wider">Clients Guided</p>
                          <p className="text-white font-mono font-bold text-lg">{user.clientCount} People</p>
                        </div>
                      </div>
                      <span className="text-xl">⭐</span>
                    </div>

                    {typeof user.clientHighestStreak === 'number' && user.clientHighestStreak > 0 && (
                      <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⚡</span>
                          <div className="text-left">
                            <p className="text-xs font-bold text-brand-primary/60 uppercase tracking-wider">Best Client Streak</p>
                            <p className="text-white font-mono font-bold text-lg">{user.clientHighestStreak} Days</p>
                          </div>
                        </div>
                        <span className="text-xl">🔥</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isOwnProfile && !showDeleteConfirm && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-8 text-xs font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Account
                </button>
              )}

              {showDeleteConfirm && (
                <div className="mt-6 w-full p-4 rounded-2xl bg-red-500/5 border border-red-500/20 animate-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-tight mb-4">
                    Danger Zone
                  </p>
                  <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                    This will permanently delete your account and remove all your data. 
                    Previously sent messages and workout history will remain as &quot;DELETED ACCOUNT&quot;.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 text-left px-1">Type your username to confirm:</label>
                      <input 
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={user.name}
                        className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 text-left px-1">Type &quot;I want to delete my account&quot;:</label>
                      <input 
                        type="text"
                        value={confirmPhrase}
                        onChange={(e) => setConfirmPhrase(e.target.value)}
                        className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#121c17] text-slate-300 border border-emerald-500/20 text-xs font-bold hover:bg-[#1a2821] transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={deleting || confirmName !== user.name || confirmPhrase.toLowerCase() !== 'I want to delete my account'.toLowerCase()}
                        className="flex-[2] px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 transition-all shadow-lg shadow-red-600/20"
                      >
                        {deleting ? 'Deleting...' : 'Permanently Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm py-8">User profile not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
