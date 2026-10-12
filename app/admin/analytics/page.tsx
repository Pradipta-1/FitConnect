"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type AnalyticsData = {
  users: {
    total: number;
    trainees: number;
    trainers: number;
    organizers: number;
    admins: number;
  };
  events: {
    total: number;
    approved: number;
    pending: number;
  };
  workouts: {
    routinesCreated: number;
    activeRoutines: number;
    completedWorkouts: number;
  };
  engagement: {
    posts: number;
    messages: number;
  };
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiFetch("/api/admin/analytics");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
          Platform Analytics & Metrics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Live statistics aggregated directly from your Supabase PostgreSQL cluster.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading live analytics...</div>
      ) : !data ? (
        <div className="text-center py-12 text-red-400">Failed to load platform analytics.</div>
      ) : (
        <>
          {/* Top Level Metric KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
              <div className="text-xs uppercase font-semibold text-emerald-400">Total Users</div>
              <div className="text-3xl font-extrabold text-white mt-1">{data.users.total}</div>
              <div className="text-xs text-slate-400 mt-1">Across all roles</div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5">
              <div className="text-xs uppercase font-semibold text-cyan-400">Completed Workouts</div>
              <div className="text-3xl font-extrabold text-white mt-1">{data.workouts.completedWorkouts}</div>
              <div className="text-xs text-slate-400 mt-1">Daily logs checked</div>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5">
              <div className="text-xs uppercase font-semibold text-purple-400">Total Events</div>
              <div className="text-3xl font-extrabold text-white mt-1">{data.events.total}</div>
              <div className="text-xs text-slate-400 mt-1">{data.events.pending} pending approval</div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
              <div className="text-xs uppercase font-semibold text-amber-400">Community Messages</div>
              <div className="text-3xl font-extrabold text-white mt-1">{data.engagement.messages}</div>
              <div className="text-xs text-slate-400 mt-1">& {data.engagement.posts} community posts</div>
            </div>
          </div>

          {/* User Role Distribution */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">User Base Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-medium">Trainees</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{data.users.trainees}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-medium">Trainers</span>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{data.users.trainers}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-medium">Organizers</span>
                <p className="text-2xl font-bold text-teal-400 mt-1">{data.users.organizers}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-medium">Admins</span>
                <p className="text-2xl font-bold text-purple-400 mt-1">{data.users.admins}</p>
              </div>
            </div>
          </div>

          {/* Training & Workout Engagement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Workout & Routine Engagement</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Routines Created:</span>
                  <span className="font-semibold">{data.workouts.routinesCreated}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Active Routines:</span>
                  <span className="font-semibold text-emerald-400">{data.workouts.activeRoutines}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Logged Workout Sessions:</span>
                  <span className="font-semibold text-cyan-400">{data.workouts.completedWorkouts}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Event Moderation Status</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Events:</span>
                  <span className="font-semibold">{data.events.total}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Approved Events:</span>
                  <span className="font-semibold text-emerald-400">{data.events.approved}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Pending Review:</span>
                  <span className="font-semibold text-amber-400">{data.events.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
