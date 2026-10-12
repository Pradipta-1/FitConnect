"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserShell from "@/components/UserShell";
import { apiFetch } from "@/lib/apiFetch";

type Peer = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  location?: string | null;
  sharedEvent: string;
  specializations?: string[];
};

export default function UserClientsPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPeers() {
      try {
        const res = await apiFetch("/api/user/peers");
        const json = await res.json();
        if (json.success && json.data) {
          setPeers(json.data.peers || []);
        }
      } catch (err) {
        console.error("Failed to load training partners:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPeers();
  }, []);

  return (
    <UserShell>
      <div id="clients" className="tab-pane active space-y-6 max-w-6xl mx-auto">
        <div className="card">
          <h1 className="card-title text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Training Partners & Fitness Network
          </h1>
          <p className="card-subtitle text-slate-400">
            Athletes and coaching trainers you share fitness events and group workouts with in FitConnect.
          </p>
        </div>

        {/* Info card */}
        <div className="card border border-emerald-500/20 bg-emerald-950/15 p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-emerald-300">Looking for 1-on-1 Certified Coaches?</h3>
            <p className="text-xs text-slate-400">Discover elite fitness coaches and request customized 7-day workout plans.</p>
          </div>
          <Link
            href="/user/trainers"
            className="px-3.5 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors"
          >
            Find Trainers &rarr;
          </Link>
        </div>

        {/* Peer list */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Co-Athletes & Mentors</span>
            <span className="text-xs font-normal text-slate-400">
              {loading ? "Loading..." : `${peers.length} Partners`}
            </span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading your network...</div>
          ) : peers.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 space-y-3">
              <p>You haven&apos;t joined any shared fitness events yet.</p>
              <Link
                href="/user/events"
                className="inline-block px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg text-xs"
              >
                Browse Upcoming Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-sm flex-shrink-0">
                    {peer.avatarUrl ? (
                      <img src={peer.avatarUrl} alt={peer.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      peer.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-200 truncate">{peer.name}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                        {peer.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">Event: {peer.sharedEvent}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserShell>
  );
}
