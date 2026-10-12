"use client";

import { FormEvent, useState } from "react";
import OrganizerShell from "@/components/OrganizerShell";
import { apiFetch } from "@/lib/apiFetch";

export default function OrganizerCreateEventPage() {
  const [title, setTitle] = useState("");
  const [sportType, setSportType] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [limit, setLimit] = useState(50);
  const [description, setDescription] = useState("");
  const [openToTrainers, setOpenToTrainers] = useState(false);
  const [trainersNeeded, setTrainersNeeded] = useState(0);
  const [trainerConditions, setTrainerConditions] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await apiFetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sportType,
        location,
        date,
        time,
        participantLimit: limit,
        description,
        openToTrainers,
        trainersNeeded: openToTrainers ? trainersNeeded : undefined,
        trainerConditions: openToTrainers ? trainerConditions : undefined
      })
    });
    const data = await res.json();
    if (data.success) {
      setMessage("Event created and pending admin approval.");
      setTitle("");
      setSportType("");
      setLocation("");
      setDate("");
      setTime("");
      setDescription("");
      setOpenToTrainers(false);
      setTrainersNeeded(0);
      setTrainerConditions("");
    } else {
      setMessage(data.error || "Failed to create event");
    }
  }

  return (
    <OrganizerShell>
      <div id="create-event" className="tab-pane active">
        <div className="card">
          <h1 className="card-title">Create Event</h1>
          <p className="card-subtitle mb-6">Set up a new event for players and trainers.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Event Title</label>
                <input
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Sport Type</label>
                <input
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                  value={sportType}
                  onChange={e => setSportType(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Location</label>
                <input
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Time</label>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Participant Limit</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">Event Description</label>
              <textarea
                className="w-full rounded-lg border border-slate-800 bg-[#0a0a0c] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-4 rounded-xl border border-emerald-500/15 bg-[#070b09]/90 p-4">
              <label className="inline-flex items-center gap-3 text-sm font-medium text-white cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-emerald-500/30 text-[#00c896] focus:ring-[#00c896] focus:ring-offset-[#060907] bg-[#121c17]"
                  checked={openToTrainers}
                  onChange={e => setOpenToTrainers(e.target.checked)}
                />
                Open to Trainers
              </label>
              {openToTrainers && (
                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-emerald-500/15">
                  <div>
                    <label className="block text-xs font-medium text-emerald-400 mb-1 tracking-wide uppercase">Trainers Needed</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-emerald-500/20 bg-[#0d1411] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                      value={trainersNeeded}
                      onChange={e => setTrainersNeeded(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-400 mb-1 tracking-wide uppercase">Conditions for Trainers</label>
                    <input
                      className="w-full rounded-lg border border-emerald-500/20 bg-[#0d1411] px-3 py-2.5 text-white focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors"
                      value={trainerConditions}
                      onChange={e => setTrainerConditions(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            {message && (
              <div className={`rounded-lg p-3 text-sm ${message.includes("failed") || message.includes("error") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                {message}
              </div>
            )}
            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg bg-[#00c896] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#00a87a] transition-colors shadow-[0_0_15px_rgba(0,200,150,0.3)] hover:shadow-[0_0_20px_rgba(0,200,150,0.5)]"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </OrganizerShell>
  );
}

