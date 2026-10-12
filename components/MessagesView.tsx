"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import ProfileModal from "./ProfileModal";

type Thread = {
  partner: { id: string; name: string | null; avatarUrl?: string | null; isEvent?: boolean; role?: string } | null;
  lastMessage: string;
  updatedAt: string;
  type?: "direct" | "event";
  eventId?: string;
  unreadCount?: number;
};

type Message = {
  id: string;
  senderId: string;
  sender: { id: string; name: string; role: string; avatarUrl?: string | null } | null;
  receiverId?: string | null;
  eventId?: string | null;
  content: string;
  imageUrl?: string | null;
  isSystem?: boolean;
  createdAt: string;
};

export default function MessagesView() {
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [eventOrganizerId, setEventOrganizerId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<{ id: string; name: string; role: string; avatarUrl?: string | null }[]>([]);
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [partnerNameOverride, setPartnerNameOverride] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newContent, setNewContent] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    setError(null);
    try {
      const res = await apiFetch("/api/messages/threads");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load threads");
      setThreads(data.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load threads");
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/messages/with/${userId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load messages");
      setMessages(data.data ?? []);
      if (data.eventOrganizerId) setEventOrganizerId(data.eventOrganizerId);
      else setEventOrganizerId(null);
      if (data.isCancelled) setIsCancelled(true);
      else setIsCancelled(false);
      if (data.participants) setParticipants(data.participants);
      else setParticipants([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
    // Fetch current user profile
    apiFetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.success) setCurrentUser(data.data);
      })
      .catch(() => {});
  }, [fetchThreads]);

  // Open conversation from URL ?with=userId
  useEffect(() => {
    if (withUserId) {
      setSelectedUserId(withUserId);
      setPartnerNameOverride(null);
    }
  }, [withUserId]);

  useEffect(() => {
    if (selectedUserId) fetchMessages(selectedUserId);
    else setMessages([]);
  }, [selectedUserId, fetchMessages]);

  // Resolve partner name when opening a new conversation (user not in threads yet)
  useEffect(() => {
    if (!selectedUserId) return;
    const inThreads = threads.some(t => t.partner?.id === selectedUserId);
    if (inThreads) return;
    let cancelled = false;
    apiFetch(`/api/users/${selectedUserId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success && data.data?.name)
          setPartnerNameOverride(data.data.name);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedUserId, threads]);

  const selectedThread = threads.find(t => t.partner?.id === selectedUserId);
  const isEventGroup = selectedThread?.type === "event" || selectedThread?.partner?.isEvent;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || (!newContent.trim() && !selectedFile)) return;
    setSending(true);
    setError(null);
    try {
      let uploadedImageUrl: string | null = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const upRes = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.success) throw new Error(upData.error || "Failed to upload image");
        uploadedImageUrl = upData.url;
      }

      const res = await apiFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          receiverId: isEventGroup ? undefined : selectedUserId,
          eventId: isEventGroup ? selectedUserId : undefined, 
          content: newContent.trim(),
          imageUrl: uploadedImageUrl
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send");
      
      setNewContent("");
      removeFile();
      setMessages(prev => [...prev, data.data]);
      await fetchThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    if (!selectedUserId || !window.confirm("Are you sure you want to remove this participant?")) return;
    try {
      const res = await apiFetch(`/api/events/${selectedUserId}/participants/${participantId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to remove participant");
      
      // Refresh messages and participants
      await fetchMessages(selectedUserId);
      await fetchThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove participant");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                setSelectedFile(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                e.preventDefault();
                break;
            }
        }
    }
  }

  function removeFile() {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const partnerName =
    partnerNameOverride ??
    selectedThread?.partner?.name ??
    "Unknown";

  const hasAnyUnread = threads.some(t => (t.unreadCount || 0) > 0);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [selectedUserId, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div className="flex h-[calc(100dvh-125px)] sm:h-[calc(100vh-140px)] min-h-[440px] max-h-[900px] overflow-hidden rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-[#090e0c]/90 backdrop-blur-xl shadow-2xl">
      {/* Thread list */}
      <aside className={`w-full md:w-80 flex-shrink-0 flex-col border-r border-emerald-500/15 bg-[#070b09]/95 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-emerald-500/15 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white">Messages</h2>
            {hasAnyUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" title="New unread messages" />
            )}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">{threads.length} chats</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingThreads ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading chats...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No conversations yet. Go to Trainers or Events to start one.
            </div>
          ) : (
            <ul className="divide-y divide-emerald-500/10">
              {threads.map((t, index) => {
                const id = t.partner?.id;
                const name = t.partner?.name ?? "DELETED ACCOUNT";
                if (!id) return null;
                const isSelected = selectedUserId === id;
                const isGroup = t.type === "event" || t.partner?.isEvent;

                return (
                  <li key={`${id}-${index}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(id);
                        setThreads(prev => prev.map(item => item.partner?.id === id ? { ...item, unreadCount: 0 } : item));
                      }}
                      className={`w-full px-3.5 sm:px-5 py-3 sm:py-3.5 text-left transition-all relative ${
                        isSelected
                          ? "bg-emerald-500/10"
                          : "hover:bg-[#0f1713]/80 active:bg-emerald-500/10"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                      )}
                      
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div 
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm overflow-hidden flex-shrink-0 relative group ${
                            isGroup ? "bg-emerald-500 text-black" : "bg-[#101a15] border border-emerald-500/25 text-emerald-400"
                          }`}
                          onClick={(e) => {
                            if (t.partner?.avatarUrl) {
                              e.stopPropagation();
                              setEnlargedImage(t.partner.avatarUrl);
                            }
                          }}
                        >
                          {t.partner?.avatarUrl ? (
                            <>
                              <img src={t.partner.avatarUrl} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-zoom-in">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                              </div>
                            </>
                          ) : isGroup ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          ) : (
                            name?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5 gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <p 
                                className={`truncate font-bold text-xs sm:text-sm ${id ? "hover:underline cursor-pointer" : ""} ${isSelected ? "text-emerald-400" : "text-white"}`}
                                onClick={(e) => {
                                  if (!isGroup && id) {
                                    e.stopPropagation();
                                    setProfileUserId(id);
                                  }
                                }}
                              >
                                {name}
                              </p>
                              {(t.unreadCount || 0) > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold text-[9px] shadow-[0_0_6px_red] flex-shrink-0 leading-none">
                                  {t.unreadCount}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap flex-shrink-0 ml-1">
                              {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="truncate text-[11px] sm:text-xs text-slate-500">{t.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Conversation */}
      <section className={`flex-1 flex-col bg-[#060907]/90 min-w-0 ${selectedUserId ? 'flex' : 'hidden md:flex'}`}>
        {selectedUserId ? (
          <>
            <div className="border-b border-emerald-500/15 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between relative bg-[#070b09]/80 min-h-[52px] sm:min-h-[58px]">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId(null);
                    if (typeof window !== "undefined" && window.location.search) {
                      window.history.replaceState({}, "", window.location.pathname);
                    }
                  }}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-emerald-400 hover:text-white hover:bg-[#121c17] transition-colors flex-shrink-0"
                  title="Back to conversations"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div 
                  className={`flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 ${isEventGroup && currentUser?.id === eventOrganizerId ? "cursor-pointer hover:bg-[#121c17] p-1 -m-1 rounded-lg transition-all" : ""}`}
                  onClick={() => isEventGroup && currentUser?.id === eventOrganizerId && setShowParticipantDropdown(!showParticipantDropdown)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isEventGroup ? "bg-emerald-500 text-black" : "bg-[#101a15] border border-emerald-500/25 text-emerald-400"
                  }`}>
                    {isEventGroup ? "G" : partnerName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2 
                        className={`font-bold text-white text-xs sm:text-base truncate ${!isEventGroup ? "hover:underline cursor-pointer" : ""}`}
                        onClick={(e) => {
                          if (!isEventGroup && selectedUserId) {
                            e.stopPropagation();
                            setProfileUserId(selectedUserId);
                          }
                        }}
                      >
                        {partnerName}
                      </h2>
                      {isEventGroup && currentUser?.id === eventOrganizerId && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowParticipantDropdown(!showParticipantDropdown);
                          }}
                          className="flex-shrink-0"
                        >
                          <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showParticipantDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {isEventGroup && <p className="text-[10px] text-slate-500 font-medium truncate">{participants.length} Participants</p>}
                  </div>
                </div>
              </div>

              {/* Participant Dropdown for Organizers */}
              {showParticipantDropdown && isEventGroup && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                    onClick={() => setShowParticipantDropdown(false)}
                  />
                  <div className="fixed inset-x-3 top-20 sm:absolute sm:top-full sm:left-6 sm:inset-x-auto sm:w-80 z-50 bg-[#090e0c] border border-emerald-500/25 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 sm:p-4 border-b border-emerald-500/15 bg-[#0d1411] flex items-center justify-between">
                      <p className="text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">Manage Participants</p>
                      <button 
                        type="button" 
                        onClick={() => setShowParticipantDropdown(false)}
                        className="sm:hidden text-slate-400 hover:text-white p-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-60 sm:max-h-64 overflow-y-auto custom-scrollbar">
                    {participants
                      .filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
                      .map(p => {
                        const isLeader = p.id === eventOrganizerId;
                        return (
                          <div key={p.id} className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-[#111a15] transition-colors border-b border-emerald-500/10 last:border-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div 
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0 cursor-pointer ${isLeader && !p.avatarUrl ? "bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "bg-[#121c17] border border-emerald-500/20 text-slate-400"}`}
                                onClick={(e) => {
                                  if (p.avatarUrl) {
                                    e.stopPropagation();
                                    setEnlargedImage(p.avatarUrl);
                                  }
                                }}
                              >
                                {p.avatarUrl ? (
                                  <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                                ) : isLeader ? (
                                  "👑"
                                ) : (
                                  p.name?.charAt(0).toUpperCase() || "?"
                                )}
                              </div>
                              <div 
                                className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setProfileUserId(p.id)}
                              >
                                <p className="text-xs sm:text-sm font-bold text-white truncate hover:underline">{p.name || "Unknown"}</p>
                                <p className="text-[9px] font-bold text-emerald-400 uppercase">{p.role}</p>
                              </div>
                            </div>
                            {!isLeader && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveParticipant(p.id);
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                                title="Remove Participant"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 sm:space-y-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium">Loading messages...</p>
                </div>
              ) : (
                <>
                  {messages.map(m => {
                    if (m.isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center my-3">
                          <div className="px-3 sm:px-4 py-1 rounded-full bg-[#101a15] border border-emerald-500/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 text-center">
                            {m.content}
                          </div>
                        </div>
                      );
                    }

                    const isOwn = currentUser ? m.senderId === currentUser.id : m.senderId !== selectedUserId;
                    const isLeader = m.senderId === eventOrganizerId;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOwn ? "items-end" : "items-start animate-in slide-in-from-left-2 duration-300"}`}
                      >
                        {isEventGroup && !isOwn && (
                          <div className="flex items-center gap-1.5 mb-1 ml-2 sm:ml-3 max-w-[85%]">
                            <button 
                              onClick={() => setProfileUserId(m.senderId)}
                              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity min-w-0"
                            >
                              {m.sender?.avatarUrl ? (
                                <img 
                                  src={m.sender.avatarUrl} 
                                  alt={m.sender.name} 
                                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0" 
                                />
                              ) : (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#121c17] flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-emerald-400 flex-shrink-0 border border-emerald-500/20">
                                  {m.sender?.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                              )}
                              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider hover:underline truncate">
                                {m.sender?.name || 'DELETED ACCOUNT'}
                              </span>
                            </button>
                            {isLeader && (
                              <span className="text-sm sm:text-base text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] flex-shrink-0" title="Group Leader">👑</span>
                            )}
                            <span className={`px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[7px] sm:text-[8px] font-bold uppercase tracking-tighter flex-shrink-0 ${
                              m.sender?.role === "TRAINER" 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                : "bg-[#101a15] text-slate-400 border border-emerald-500/20"
                            }`}>
                              {m.sender?.role === 'USER' ? 'TRAINEE' : (m.sender?.role || 'GONE')}
                            </span>
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg ${
                            isOwn
                              ? "bg-emerald-500 text-black font-medium rounded-tr-none"
                              : "bg-[#0d1411] border border-emerald-500/20 text-slate-200 rounded-tl-none ring-1 ring-emerald-500/10"
                          }`}
                        >
                          {m.imageUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden shadow-inner">
                              <img 
                                src={m.imageUrl} 
                                alt="Attached image" 
                                className="max-h-56 sm:max-h-80 w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500" 
                                onClick={() => setEnlargedImage(m.imageUrl!)}
                              />
                            </div>
                          )}
                          {m.content && <p className="whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-sm">{m.content}</p>}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <p className={`text-[9px] sm:text-[10px] font-medium ${isOwn ? "text-black/60" : "text-slate-500"}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isOwn && (
                              <svg className="w-3 h-3 text-black/40" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="p-2 sm:p-3.5 bg-[#070b09]/95 border-t border-emerald-500/15"
            >
              <div className="max-w-4xl mx-auto space-y-2">
                {previewUrl && (
                  <div className="relative inline-block group">
                    <img src={previewUrl} alt="Preview" className="h-16 sm:h-24 w-auto rounded-xl border-2 border-emerald-500/30 object-cover shadow-2xl" />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute -right-2 -top-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#090e0c] text-white hover:bg-red-500 transition-colors border border-emerald-500/20 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="flex gap-1.5 sm:gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#121c17] text-slate-400 hover:bg-[#1a2821] hover:text-emerald-400 transition-all border border-emerald-500/20 active:scale-95"
                    title="Attach image"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Write a message..."
                    className="flex-1 min-w-0 h-10 sm:h-12 rounded-xl border border-emerald-500/20 bg-[#0d1411] px-3 sm:px-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    disabled={sending || isCancelled}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={sending || isCancelled || (!newContent.trim() && !selectedFile)}
                    className="h-10 sm:h-12 px-3.5 sm:px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#121c17] disabled:text-slate-600 disabled:border disabled:border-emerald-500/10 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95 text-xs sm:text-sm"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Send</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                {isCancelled && (
                  <p className="text-center text-[10px] sm:text-xs font-bold text-red-400 mt-1 uppercase tracking-widest">Event Cancelled - No more messages allowed</p>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-500 gap-3 sm:gap-4 p-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0e1713] border border-emerald-500/20 flex items-center justify-center text-emerald-400/60 shadow-[0_0_20px_rgba(0,200,150,0.05)]">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.855-1.246L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium text-slate-400 text-xs sm:text-sm">Pick a conversation to start chatting</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 px-4 sm:px-6 py-2 text-xs text-red-500 border-t border-red-500/20">
            {error}
          </div>
        )}
      </section>

      {/* Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 rounded-full bg-black/60 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={enlargedImage} 
            alt="Full size" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
          />
        </div>
      )}

      {/* Profile Modal */}
      {profileUserId && (
        <ProfileModal 
          userId={profileUserId} 
          onClose={() => setProfileUserId(null)} 
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #222c27;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00c896;
        }
      `}</style>
    </div>
  );
}
