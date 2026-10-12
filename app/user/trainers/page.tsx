'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import UserShell from "@/components/UserShell";
import { apiFetch } from "@/lib/apiFetch";

type Trainer = { id: string; name: string | null; email: string };

export default function UserTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/trainers").then(r => r.json()),
      apiFetch("/api/routines/requests").then(r => r.json()),
      apiFetch("/api/routines").then(r => r.json())
    ])
      .then(([trainersData, requestsData, routinesData]) => {
        if (trainersData.success) setTrainers(trainersData.data ?? []);
        else setError(trainersData.error ?? "Failed to load trainers");

        if (requestsData.success) setRequests(requestsData.data ?? []);
        if (routinesData.success) setRoutines(routinesData.data ?? []);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestRoutine = async (trainerId: string) => {
    setActionLoading(trainerId);
    try {
      const res = await apiFetch("/api/routines/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId })
      });
      if (res.ok) {
        loadData(); // reload to get new requests
      } else {
        const data = await res.json();
        alert(data.error || "Failed to request routine");
      }
    } catch (e) {
      alert("Error requesting routine");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestContinual = async (trainerId: string) => {
    setActionLoading(trainerId);
    try {
      const res = await apiFetch("/api/routines/request-continual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Request sent to trainer!");
      } else {
        alert(data.error || "Failed to send request.");
      }
    } catch (e) {
      alert("Error sending request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetActive = async (routineId: string, trainerId: string) => {
    setActionLoading(trainerId);
    try {
      const res = await apiFetch(`/api/routines/${routineId}/set-active`, {
        method: "POST",
      });
      if (res.ok) {
        loadData(); // reload to get new active states
      } else {
        const data = await res.json();
        alert(data.error || "Failed to set active routine");
      }
    } catch (e) {
      alert("Error setting routine");
    } finally {
      setActionLoading(null);
    }
  };

  const getTrainerAction = (trainerId: string) => {
    // Get all routines from this specific trainer for the current user
    const trainerRoutines = routines.filter(r => r.trainerId === trainerId);

    // Priority order: active > available > archived
    const activeRoutine = trainerRoutines.find(r => r.isActive && !r.isArchived);
    const availableRoutine = trainerRoutines.find(r => !r.isActive && !r.isArchived);
    const archivedRoutine = trainerRoutines.find(r => r.isArchived);

    if (activeRoutine) {
      // User is currently using this trainer's routine
      return (
        <button disabled className="rounded-lg bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 px-4 py-2 text-sm font-semibold opacity-70 cursor-not-allowed">
          Using
        </button>
      );
    }

    if (availableRoutine) {
      // Trainer continued the routine (or sent new plan), user can set it
      return (
        <button 
          onClick={() => handleSetActive(availableRoutine.id, trainerId)}
          disabled={actionLoading === trainerId}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {actionLoading === trainerId ? "Setting..." : "Set Routine"}
        </button>
      );
    }

    if (archivedRoutine) {
      // Trainer discontinued this routine - user needs to request continuation
      return (
        <button 
          onClick={() => handleRequestContinual(trainerId)}
          disabled={actionLoading === trainerId}
          className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-500 transition-colors disabled:opacity-50"
        >
          {actionLoading === trainerId ? "Requesting..." : "Request Continual"}
        </button>
      );
    }

    // No routine at all — check if pending request
    const request = requests.find(r => r.trainerId === trainerId);
    if (request && request.status === "PENDING") {
      return (
        <button disabled className="rounded-lg bg-[#121c17] text-slate-400 border border-emerald-500/20 px-4 py-2 text-sm font-semibold opacity-70 cursor-not-allowed">
          Requested
        </button>
      );
    }

    // No routine, no request — show request button
    return (
      <button 
        onClick={() => handleRequestRoutine(trainerId)}
        disabled={actionLoading === trainerId}
        className="rounded-lg bg-[#121c17] px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-[#1a2821] hover:text-white transition-colors border border-emerald-500/25 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
      >
        {actionLoading === trainerId ? "Requesting..." : "Request Routine"}
      </button>
    );
  };

  return (
    <UserShell>
      <div id="trainers" className="tab-pane space-y-3">
        <div className="card !py-2.5 !px-4 !mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="card-title !text-base sm:!text-lg">Trainers</h1>
            <p className="card-subtitle !text-xs">
              Browse trainers, request routines, and start a conversation.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 w-fit">
            {trainers.length} Available Coaches
          </span>
        </div>
        {error && (
          <div className="card !py-2 !px-4 bg-red-500/10 border-red-500/30">
            <p className="card-subtitle !text-xs text-red-400">
              {error}
            </p>
          </div>
        )}
        <div className="card !py-3 !px-4">
          {loading ? (
            <p className="card-subtitle !text-xs">Loading trainers…</p>
          ) : trainers.length === 0 ? (
            <p className="card-subtitle !text-xs">No trainers found.</p>
          ) : (
            <ul className="divide-y divide-emerald-500/10 rounded-xl border border-emerald-500/20 bg-[#070b09]/80 max-h-[calc(100vh-230px)] overflow-y-auto custom-scrollbar">
              {trainers.map(t => (
                <li
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-3 hover:bg-[#0e1713] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#121c17] border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {t.name ? t.name.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name ?? "Coach"}</p>
                      <p className="text-xs text-slate-400">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {getTrainerAction(t.id)}
                    <Link
                      href={`/user/messages?with=${t.id}`}
                      className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 transition-colors shadow-sm shadow-emerald-500/20"
                    >
                      Message
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </UserShell>
  );
}
