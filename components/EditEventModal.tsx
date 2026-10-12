"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";

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
};

type Props = {
  event: Event | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditEventModal({ event, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    sportType: "",
    location: "",
    startDate: "",
    endDate: "",
    timeRange: "",
    participantLimit: "10",
    description: "",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        sportType: event.sportType,
        location: event.location,
        startDate: event.startDate ? event.startDate.split("T")[0] : "",
        endDate: event.endDate ? event.endDate.split("T")[0] : "",
        timeRange: event.timeRange || "",
        participantLimit: String(event.participantLimit),
        description: event.description,
      });
    }
  }, [event]);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || "Failed to update event");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event COMPLETELY? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || "Failed to delete event");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#090e0c] border border-emerald-500/20 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-emerald-500/15 flex justify-between items-center bg-[#070b09]/80">
          <h2 className="text-2xl font-bold text-white">Edit Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Event Title</label>
            <input
              required
              className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Sport Type</label>
              <input
                required
                className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                value={formData.sportType}
                onChange={(e) => setFormData({ ...formData, sportType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Participant Limit</label>
              <input
                required
                type="number"
                min="1"
                className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                value={formData.participantLimit}
                onChange={(e) => setFormData({ ...formData, participantLimit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Location</label>
            <input
              required
              className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Start Date</label>
              <input
                required
                type="date"
                className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">End Date</label>
              <input
                required
                type="date"
                className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Time Range</label>
            <input
              required
              className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              value={formData.timeRange}
              onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              required
              className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {error && <p className="text-red-400 text-sm font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

          <div className="pt-6 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-[#121c17] hover:bg-[#1a2821] text-white border border-emerald-500/25 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#121c17] text-black font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl border border-red-500/30 transition-all mt-4"
            >
              Delete Event Completely
            </button>
          </div>
        </form>
      </div>

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
