"use client";

import { useEffect, useState } from "react";
import TrainerShell from "@/components/TrainerShell";
import { apiFetch } from "@/lib/apiFetch";

type EarningRecord = {
  id: string;
  paymentOffered: number;
  currency: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  organizerMessage: string;
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  event: {
    id: string;
    title: string;
    sportType: string;
    location: string;
    startDate?: string | null;
  };
};

type EarningsSummary = {
  totalEarnings: number;
  pendingEarnings: number;
  acceptedCount: number;
  pendingCount: number;
  currency: string;
  history: EarningRecord[];
};

export default function TrainerEarningsPage() {
  const [data, setData] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEarnings() {
      try {
        const res = await apiFetch("/api/trainer/earnings");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load earnings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, []);

  return (
    <TrainerShell>
      <div id="earnings" className="tab-pane active space-y-6 max-w-6xl mx-auto">
        <div className="card">
          <h1 className="card-title text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Trainer Earnings & Financials
          </h1>
          <p className="card-subtitle text-slate-400">
            Realized payouts, pending event invitations, and compensation records backed by Supabase.
          </p>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">
              Realized Earnings
            </div>
            <div className="text-3xl font-extrabold text-white flex items-baseline gap-1.5">
              <span>₹{(data?.totalEarnings || 0).toLocaleString()}</span>
              <span className="text-xs font-normal text-emerald-400/80">{data?.currency || "INR"}</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              From {data?.acceptedCount || 0} completed & accepted sessions
            </div>
          </div>

          <div className="card border border-amber-500/30 bg-amber-950/20 backdrop-blur-xl p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              Pending Payouts
            </div>
            <div className="text-3xl font-extrabold text-white flex items-baseline gap-1.5">
              <span>₹{(data?.pendingEarnings || 0).toLocaleString()}</span>
              <span className="text-xs font-normal text-amber-400/80">{data?.currency || "INR"}</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Across {data?.pendingCount || 0} pending organizer invites
            </div>
          </div>

          <div className="card border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-xl p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-1">
              Total Contracts
            </div>
            <div className="text-3xl font-extrabold text-white">
              {(data?.history || []).length}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Total lifetime invitations received
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Session & Event Contracts</span>
            <span className="text-xs font-normal text-slate-400">
              {loading ? "Loading..." : `${(data?.history || []).length} Records`}
            </span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading your earnings records...</div>
          ) : !data || data.history.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No event compensation invitations recorded yet. When organizers invite you to coach events with payment offers, they will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {data.history.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{item.event.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {item.event.sportType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Organizer: {item.organizer.name}</span>
                      <span>Location: {item.event.location}</span>
                      <span>Date: {item.event.startDate ? new Date(item.event.startDate).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.organizerMessage && (
                      <p className="text-xs text-slate-500 italic">
                        &quot;{item.organizerMessage}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-base font-bold text-white">
                        ₹{item.paymentOffered.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{item.currency}</div>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          item.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : item.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TrainerShell>
  );
}
