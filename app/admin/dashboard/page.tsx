"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiFetch("/api/admin/analytics");
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
          Admin Command Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level metrics, pending approvals, and moderation actions.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading admin overview...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/events"
            className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 hover:border-amber-400 transition-all group"
          >
            <div className="text-xs uppercase font-semibold text-amber-400">Pending Events</div>
            <div className="text-3xl font-extrabold text-white mt-2 group-hover:translate-x-1 transition-transform">
              {stats?.events?.pending || 0}
            </div>
            <div className="text-xs text-slate-400 mt-2">Click to review and approve &rarr;</div>
          </Link>

          <Link
            href="/admin/trainers"
            className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 hover:border-cyan-400 transition-all group"
          >
            <div className="text-xs uppercase font-semibold text-cyan-400">Total Trainers</div>
            <div className="text-3xl font-extrabold text-white mt-2 group-hover:translate-x-1 transition-transform">
              {stats?.users?.trainers || 0}
            </div>
            <div className="text-xs text-slate-400 mt-2">Manage coach certifications &rarr;</div>
          </Link>

          <Link
            href="/admin/analytics"
            className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 hover:border-emerald-400 transition-all group"
          >
            <div className="text-xs uppercase font-semibold text-emerald-400">Active Userbase</div>
            <div className="text-3xl font-extrabold text-white mt-2 group-hover:translate-x-1 transition-transform">
              {stats?.users?.total || 0}
            </div>
            <div className="text-xs text-slate-400 mt-2">View detailed platform metrics &rarr;</div>
          </Link>
        </div>
      )}
    </div>
  );
}
