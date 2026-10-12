"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TrainerShell from "@/components/TrainerShell";
import { apiFetch } from "@/lib/apiFetch";

export default function TrainerProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string; email: string; avatarUrl?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
            setName(data.data.name || "");
            setRole(data.data.role || "");
            setPreviewUrl(data.data.avatarUrl || null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      sessionStorage.removeItem("auth_token");
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  async function handleSave() {
    setUpdating(true);
    setMessage(null);
    try {
      let uploadedImageUrl = user?.avatarUrl;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const upRes = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          uploadedImageUrl = upData.url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const res = await apiFetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, role, avatarUrl: uploadedImageUrl })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setPreviewUrl(data.data.avatarUrl || null);
        setSelectedFile(null);
        setMessage({ type: 'success', text: "Profile updated successfully!" });
        setIsEditing(false);
        setPassword(""); // Clear password field
        
        // If role changed, we might need to redirect
        if (data.data.role.toLowerCase() !== (user?.role?.toLowerCase())) {
          router.push(`/${data.data.role.toLowerCase()}/dashboard`);
        }
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to update profile" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "An error occurred while saving." });
    } finally {
      setUpdating(false);
    }
  }

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

  return (
    <TrainerShell>
      <div id="profile-settings" className="tab-pane active">
        <div className="card">
          <h1 className="card-title">Profile &amp; Settings</h1>
          <p className="card-subtitle">
            Update your trainer profile and preferences here.
          </p>

          <div className="mt-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                {message.text}
              </div>
            )}

            {loading ? (
              <p className="text-slate-400">Loading profile data...</p>
            ) : user ? (
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4 max-w-md">
                    <div className="flex flex-col items-center sm:items-start gap-4 mb-6">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full bg-[#121c17] border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl text-emerald-400 font-bold">{name?.charAt(0)?.toUpperCase()}</span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleFileChange}
                        />
                      </div>
                      <p className="text-xs text-slate-400">Click to upload new picture</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Username</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-50 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">New Password (leave blank to keep current)</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-50 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Role</label>
                      <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-50 focus:border-emerald-500 outline-none"
                      >
                        <option value="USER">User (Trainee)</option>
                        <option value="TRAINER">Trainer</option>
                        <option value="ORGANIZER">Organizer</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div 
                        className="w-24 h-24 rounded-full bg-[#121c17] border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                        onClick={() => user.avatarUrl && setEnlargedImage(user.avatarUrl)}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-emerald-400 font-bold">{user.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Username</h3>
                        <p className="mt-1 text-xl font-bold text-slate-50">{user.name}</p>
                        <p className="mt-1 text-sm text-emerald-400 capitalize bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">{user.role}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Email</h3>
                      <p className="mt-1 text-lg text-slate-300">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-400">Failed to load profile data.</p>
            )}

            <div className="flex gap-4 pt-6 border-t border-[var(--glass-border)]">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={updating}
                    className="action-btn"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setName(user?.name || "");
                      setRole(user?.role || "");
                      setPreviewUrl(user?.avatarUrl || null);
                      setSelectedFile(null);
                      setPassword("");
                    }}
                    className="action-btn bg-[#121c17] text-slate-300 hover:bg-[#1a2821] border border-emerald-500/25"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="action-btn"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="action-btn bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-900"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            <div className="pt-8 border-t border-emerald-500/15">
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Account
                </button>
              ) : (
                <div className="max-w-md p-6 rounded-2xl bg-red-500/5 border border-red-500/20 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-tight mb-2">Danger Zone</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    This will permanently delete your account and remove all your data. 
                    Sent messages and workout history will be anonymized as &quot;DELETED ACCOUNT&quot;.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Type your username to confirm:</label>
                      <input 
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={user?.name}
                        className="w-full bg-[#060907] border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Type &quot;I want to delete my account&quot;:</label>
                      <input 
                        type="text"
                        value={confirmPhrase}
                        onChange={(e) => setConfirmPhrase(e.target.value)}
                        className="w-full bg-[#060907] border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#121c17] text-slate-300 text-sm font-bold hover:bg-[#1a2821] border border-emerald-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={deleting || confirmName !== user?.name || confirmPhrase.toLowerCase() !== 'I want to delete my account'.toLowerCase()}
                        className="flex-[2] px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-30 transition-all shadow-lg shadow-red-600/20"
                      >
                        {deleting ? 'Deleting...' : 'Permanently Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#121c17] text-white hover:bg-[#1a2821] transition-colors focus:outline-none ring-1 ring-emerald-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src={enlargedImage} 
              alt="Enlarged profile" 
              className="w-full max-w-lg aspect-square object-cover rounded-full shadow-2xl ring-4 ring-emerald-500/30"
            />
          </div>
        </div>
      )}
    </TrainerShell>
  );
}
