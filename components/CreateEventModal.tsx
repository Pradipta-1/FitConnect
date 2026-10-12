"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateEventModal({ isOpen, onClose, onSuccess }: Props) {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || "Failed to create event");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#090e0c] border border-emerald-500/20 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-emerald-500/15 flex justify-between items-center bg-[#070b09]/80">
          <h2 className="text-2xl font-bold text-white">Create New Event</h2>
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
              placeholder="e.g. Morning Yoga Session"
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
                placeholder="e.g. Yoga"
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
              placeholder="e.g. Central Park, NY"
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
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
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
                min={formData.startDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Time Range (e.g. 10:00 AM - 12:00 PM)</label>
            <input
              required
              className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              placeholder="e.g. 08:00 AM - 09:30 AM"
              value={formData.timeRange}
              onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              required
              className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
              placeholder="Tell people what to expect..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="pt-4 flex gap-3">
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
              className="flex-[2] px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#121c17] disabled:text-slate-600 text-black font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Creating..." : "Create Event"}
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
