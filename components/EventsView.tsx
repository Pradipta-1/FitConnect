"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import CreateEventModal from "./CreateEventModal";
import EditEventModal from "./EditEventModal";
import ProfileModal from "./ProfileModal";

type Event = {
  id: string;
  title: string;
  sportType: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  timeRange: string | null;
  participantLimit: number;
  description: string;
  isParticipating: boolean;
  isOrganizer: boolean;
  organizer: { id: string; name: string };
  participants: { id: string; name: string; avatarUrl?: string | null }[];
  trainerParticipants: { id: string; name: string; avatarUrl?: string | null }[];
};

type Props = {
  role: "USER" | "TRAINER" | "ORGANIZER";
};

export default function EventsView({ role }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveParticipant = async (eventId: string, userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this event?`)) return;
    setRemovingId(userId);
    try {
      const res = await apiFetch(`/api/events/${eventId}/participants/${userId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setViewingParticipants(prev => {
          if (!prev) return null;
          return {
            ...prev,
            participants: prev.participants.filter(p => p.id !== userId),
            trainerParticipants: prev.trainerParticipants.filter(tp => tp.id !== userId)
          };
        });
        fetchEvents();
      } else {
        alert(data.error || "Failed to remove participant");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Error removing participant");
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await apiFetch("/api/events");
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (eventId: string) => {
    setJoiningId(eventId);
    try {
      const res = await apiFetch(`/api/events/${eventId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents(); // Refresh to update participation status
      } else {
        alert(data.error || "Failed to join event");
      }
    } catch (err) {
      console.error("Join error:", err);
    } finally {
      setJoiningId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button for Trainers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Fitness Events</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Discover, join, and participate in community sports events.</p>
        </div>
        {role === "TRAINER" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs sm:text-sm rounded-lg transition-all shadow-[0_0_15px_rgba(0,200,150,0.3)] flex items-center gap-1.5 w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Event
          </button>
        )}
      </div>

      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 animate-in fade-in duration-300"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={enlargedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-slate-400 text-xs sm:text-sm">Finding upcoming events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-[#090e0c]/90 border border-emerald-500/15 rounded-2xl">
          <p className="text-slate-400 text-base">No events found yet. Be the first to start one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-8">
          {events.map((event) => {
            const totalParticipants = (event.participants?.length || 0) + (event.trainerParticipants?.length || 0);
            const isFull = totalParticipants >= event.participantLimit;

            return (
              <div
                key={event.id}
                className="group relative bg-[#090e0c]/90 backdrop-blur-xl border border-emerald-500/15 hover:border-emerald-400/50 rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:translate-y-[-2px] flex flex-col shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_30px_rgba(0,200,150,0.12)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    {event.sportType}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {totalParticipants}/{event.participantLimit} Participants
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors">
                  {event.title}
                </h3>
                
                <p className="text-slate-400 text-xs sm:text-sm mb-3 line-clamp-2 flex-grow">
                  {event.description}
                </p>

                <div className="space-y-2 pt-3 border-t border-emerald-500/15">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {event.startDate ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}` : "Date TBD"}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.timeRange || "Time TBD"}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex -space-x-2 overflow-hidden">
                    {/* Participant avatars */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#090e0c] bg-[#121c17] border border-emerald-500/25 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                        P{i}
                      </div>
                    ))}
                    {totalParticipants > 3 && (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#090e0c] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                        +{totalParticipants - 3}
                      </div>
                    )}
                  </div>

                  {event.isOrganizer ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingParticipants(event)}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition-all text-sm"
                      >
                        Participants
                      </button>
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="px-4 py-2 bg-[#121c17] hover:bg-[#1a2821] text-white font-bold rounded-xl border border-emerald-500/25 transition-all text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  ) : event.isParticipating ? (
                    <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Joined
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(event.id)}
                      disabled={isFull || joiningId === event.id}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(0,200,150,0.25)] disabled:opacity-50 disabled:bg-[#121c17] disabled:text-slate-600 disabled:shadow-none"
                    >
                      {joiningId === event.id ? "Joining..." : isFull ? "Full" : "Join Event"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participant List View for Organizers */}
      {viewingParticipants && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#090e0c] border border-emerald-500/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-emerald-500/15 flex justify-between items-center bg-[#070b09]/80">
              <div>
                <h2 className="text-xl font-bold text-white">{viewingParticipants.title}</h2>
                <p className="text-sm text-slate-400">Participant List</p>
              </div>
              <button onClick={() => setViewingParticipants(null)} className="text-slate-400 hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              {viewingParticipants.participants.length === 0 && viewingParticipants.trainerParticipants.length === 0 ? (
                <p className="text-center text-slate-500 py-8 italic">No participants have joined yet.</p>
              ) : (
                <>
                  {viewingParticipants.trainerParticipants.map(tp => (
                    <div key={tp.id} className="flex items-center justify-between p-3 bg-[#0d1411] border border-emerald-500/20 rounded-xl">
                      <button 
                        onClick={() => setProfileUserId(tp.id)}
                        className="flex items-center gap-3 text-white font-medium hover:text-emerald-400 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ring-1 ring-emerald-500/20">
                          {tp.avatarUrl ? <img src={tp.avatarUrl} alt={tp.name} className="w-full h-full object-cover" /> : tp.name.charAt(0)}
                        </div>
                        {tp.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Trainer</span>
                        {viewingParticipants.isOrganizer && tp.id !== viewingParticipants.organizer.id && (
                          <button
                            onClick={() => handleRemoveParticipant(viewingParticipants.id, tp.id, tp.name)}
                            disabled={removingId === tp.id}
                            className="px-2 py-1 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 text-[11px] font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
                            title="Remove trainer from event"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {viewingParticipants.participants.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 hover:bg-[#0e1713] rounded-xl transition-all">
                      <button 
                        onClick={() => setProfileUserId(p.id)}
                        className="flex items-center gap-3 text-white font-medium hover:text-emerald-400 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#121c17] flex items-center justify-center text-xs font-bold overflow-hidden ring-1 ring-emerald-500/20 text-emerald-400">
                          {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                        </div>
                        {p.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Member</span>
                        {viewingParticipants.isOrganizer && p.id !== viewingParticipants.organizer.id && (
                          <button
                            onClick={() => handleRemoveParticipant(viewingParticipants.id, p.id, p.name)}
                            disabled={removingId === p.id}
                            className="px-2 py-1 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 text-[11px] font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
                            title="Remove member from event"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="p-6 bg-[#070b09]/80 border-t border-emerald-500/15 flex justify-end">
              <button 
                onClick={() => setViewingParticipants(null)}
                className="px-6 py-2 bg-[#121c17] hover:bg-[#1a2821] text-white border border-emerald-500/25 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating Event */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
      />

      <EditEventModal
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSuccess={fetchEvents}
      />

      {profileUserId && (
        <ProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </div>
  );
}
