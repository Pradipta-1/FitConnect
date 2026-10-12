"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OrganizerShell from "@/components/OrganizerShell";
import { apiFetch } from "@/lib/apiFetch";

type Participant = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  location?: string | null;
  specializations?: string[];
};

type EventRoster = {
  id: string;
  title: string;
  sportType: string;
  location: string;
  startDate?: string | null;
  participantLimit: number;
  totalParticipants: number;
  participants: Participant[];
  trainers: Participant[];
};

type RosterData = {
  totalAthletes: number;
  totalTrainers: number;
  totalEvents: number;
  events: EventRoster[];
};

export default function OrganizerParticipantsPage() {
  const [data, setData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoster() {
      try {
        const res = await apiFetch("/api/organizer/participants");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load participants:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoster();
  }, []);

  return (
    <OrganizerShell>
      <div id="participants" className="tab-pane active space-y-6 max-w-6xl mx-auto">
        <div className="card">
          <h1 className="card-title text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
            Event Participants & Rosters
          </h1>
          <p className="card-subtitle text-slate-400">
            View athletes and certified trainers who have joined your organized events.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">
              Total Enrolled Athletes
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.totalAthletes || 0}
            </div>
          </div>
          <div className="card border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-xl p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-1">
              Assigned Trainers
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.totalTrainers || 0}
            </div>
          </div>
          <div className="card border border-teal-500/30 bg-teal-950/20 backdrop-blur-xl p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-wider font-semibold text-teal-400 mb-1">
              Active Events
            </div>
            <div className="text-3xl font-extrabold text-white">
              {data?.totalEvents || 0}
            </div>
          </div>
        </div>

        {/* Rosters by Event */}
        {loading ? (
          <div className="card text-center py-10 text-slate-400">Loading participant rosters...</div>
        ) : !data || data.events.length === 0 ? (
          <div className="card text-center py-10 text-slate-400 space-y-3">
            <p>You haven&apos;t created any events yet.</p>
            <Link
              href="/organizer/events/create"
              className="inline-block px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg text-sm"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.events.map((event) => (
              <div key={event.id} className="card border border-slate-800 bg-[#0d1411]/90 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{event.title}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20">
                        {event.sportType}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {event.location} • {event.totalParticipants}/{event.participantLimit} Participants Filled
                    </p>
                  </div>
                  <Link
                    href={`/organizer/messages`}
                    className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    Open Group Chat
                  </Link>
                </div>

                {/* Athletes Section */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Athletes ({event.participants.length})
                  </h3>
                  {event.participants.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No athletes have joined this event yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {event.participants.map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                        >
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs flex-shrink-0">
                            {athlete.avatarUrl ? (
                              <img src={athlete.avatarUrl} alt={athlete.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              athlete.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-200 truncate">{athlete.name}</p>
                            <p className="text-xs text-slate-400 truncate">{athlete.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trainers Section */}
                {event.trainers.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                      Coaching Trainers ({event.trainers.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {event.trainers.map((trainer) => (
                        <div
                          key={trainer.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20"
                        >
                          <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                            {trainer.avatarUrl ? (
                              <img src={trainer.avatarUrl} alt={trainer.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              trainer.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-200 truncate">{trainer.name}</p>
                            <p className="text-xs text-cyan-400/80 truncate">
                              {trainer.specializations?.join(", ") || "Trainer"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </OrganizerShell>
  );
}
