'use client';

import { useEffect, useState } from "react";
import TrainerShell from "@/components/TrainerShell";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

type Routine = {
  id: string;
  userId: string;
  isActive: boolean;
  user: {
    name: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
};

export default function TrainerDashboardPage() {
  const [activeRoutines, setActiveRoutines] = useState<Routine[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [trainerProfile, setTrainerProfile] = useState<any | null>(null);
  const [clientRoutine, setClientRoutine] = useState<any | null>(null);
  const [prevRoutines, setPrevRoutines] = useState<any[]>([]);
  const [clientProgress, setClientProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Set Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activePlanDayIndex, setActivePlanDayIndex] = useState(0);
  const [planDays, setPlanDays] = useState([
    { day: "Mon", title: "", description: "" },
    { day: "Tue", title: "", description: "" },
    { day: "Wed", title: "", description: "" },
    { day: "Thu", title: "", description: "" },
    { day: "Fri", title: "", description: "" },
    { day: "Sat", title: "", description: "" },
    { day: "Sun", title: "", description: "" },
  ]);
  const [savingPlan, setSavingPlan] = useState(false);

  // Calendar State
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const [allClients, setAllClients] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const todayDateString = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDayName = daysOfWeek[today.getDay()];

  async function loadDashboardData() {
    try {
      const [routinesRes, meRes, usersRes, requestsRes] = await Promise.all([
        apiFetch('/api/routines'),
        apiFetch('/api/auth/me'),
        apiFetch('/api/users'),
        apiFetch('/api/routines/requests')
      ]);
      const routinesData = await routinesRes.json();
      const meData = await meRes.json();
      const usersData = await usersRes.json();
      const requestsData = await requestsRes.json();

      if (meData.success) {
        setTrainerProfile(meData.data);
      }

      if (usersData.success && Array.isArray(usersData.data)) {
        setAllClients(usersData.data);
      }

      if (requestsData.success && Array.isArray(requestsData.data)) {
        setPendingRequests(requestsData.data);
      }

      if (routinesData.success) {
        setActiveRoutines(routinesData.data ?? []);
      }

      // Default selected client: prioritize active routine client, else first registered client
      if (!selectedClientId) {
        if (routinesData.data && routinesData.data.length > 0) {
          setSelectedClientId(routinesData.data[0].userId);
        } else if (usersData.data && usersData.data.length > 0) {
          setSelectedClientId(usersData.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadClientData(clientId: string) {
    setProgressLoading(true);
    try {
      const [routineRes, progressRes] = await Promise.all([
        apiFetch(`/api/routines?userId=${clientId}`),
        apiFetch(`/api/progress?clientId=${clientId}`)
      ]);
      const routineData = await routineRes.json();
      const progressData = await progressRes.json();

      if (routineData.success && Array.isArray(routineData.data)) {
        // Find the active routine assigned by this trainer, or any active routine
        const active = routineData.data.find((x: any) => x.userId === clientId && x.isActive);
        const archived = routineData.data.filter((x: any) => x.userId === clientId && x.isArchived);
        
        setClientRoutine(active || null);
        setPrevRoutines(archived || []);
      } else {
        setClientRoutine(null);
        setPrevRoutines([]);
      }
      if (progressData.success) {
        setClientProgress(progressData.data ?? []);
      } else {
        setClientProgress([]);
      }
    } catch (err) {
      console.error('Error loading client data:', err);
    } finally {
      setProgressLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientData(selectedClientId);
    }
  }, [selectedClientId]);

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDay + 1;
    if (dayNumber > 0 && dayNumber <= daysInMonth) {
      return { date: new Date(viewYear, viewMonth, dayNumber), dayNumber };
    }
    return null;
  });

  const getDayProgress = (d: Date) => {
    const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    return clientProgress.find(p => p.dateString === ds);
  };

  const selectedClient = allClients.find(c => c.id === selectedClientId) || activeRoutines.find(r => r.userId === selectedClientId)?.user;

  const handleDayClick = (d: Date) => {
    const scrollContainer = document.querySelector('.main-content');
    if (scrollContainer) {
      setPrevScrollPos(scrollContainer.scrollTop);
    }
    setSelectedDate(d);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    const scrollContainer = document.querySelector('.main-content');
    if (scrollContainer && prevScrollPos !== 0) {
      scrollContainer.scrollTo({ top: prevScrollPos, behavior: 'smooth' });
    }
  };

  // Plan Creator Presets
  const applyPreset = (presetType: string) => {
    if (presetType === "ppl") {
      setPlanDays([
        { day: "Mon", title: "Push (Chest, Shoulders, Triceps)", description: "Bench Press: 4x8-10\nIncline Dumbbell Press: 3x10-12\nOverhead Shoulder Press: 4x8-10\nLateral Raises: 3x15\nTricep Rope Pushdowns: 3x12-15" },
        { day: "Tue", title: "Pull (Back & Biceps)", description: "Barbell Rows: 4x8-10\nLat Pulldowns: 3x10-12\nSeated Cable Rows: 3x12\nFace Pulls: 3x15\nBarbell Bicep Curls: 3x10-12\nHammer Curls: 3x12" },
        { day: "Wed", title: "Legs & Core", description: "Barbell Squats: 4x8-10\nRomanian Deadlifts: 3x10-12\nLeg Press: 3x12\nCalf Raises: 4x15\nHanging Leg Raises: 3x15\nPlank: 3x60s" },
        { day: "Thu", title: "Active Recovery & Mobility", description: "30-40 min light cardio (walk or cycle)\nFull body dynamic stretching and foam rolling\nHydration and mobility work" },
        { day: "Fri", title: "Upper Body Hypertrophy", description: "Incline Bench Press: 4x10\nPull-ups / Lat Pulldowns: 3x10-12\nDumbbell Shoulder Press: 3x10\nCable Flyes: 3x15\nBicep & Tricep Superset: 3x12" },
        { day: "Sat", title: "Lower Body & HIIT", description: "Deadlifts: 4x6-8\nBulgarian Split Squats: 3x10/leg\nLeg Extensions: 3x15\n15 min HIIT cardio finisher" },
        { day: "Sun", title: "Rest & Recovery", description: "Complete rest day. Focus on 8+ hours sleep, optimal protein intake, and recovery." }
      ]);
    } else if (presetType === "fullbody") {
      setPlanDays([
        { day: "Mon", title: "Full Body Strength A", description: "Barbell Squats: 3x8\nBench Press: 3x8\nBarbell Rows: 3x8\nOverhead Press: 3x10\nPlank: 3x60s" },
        { day: "Tue", title: "Cardio & Core", description: "30 mins Interval Cardio (Running/Cycling)\nHanging Knee Raises: 3x15\nRussian Twists: 3x20" },
        { day: "Wed", title: "Full Body Strength B", description: "Deadlifts: 3x6\nIncline Dumbbell Press: 3x10\nLat Pulldowns: 3x10\nWalking Lunges: 3x12/leg\nFace Pulls: 3x15" },
        { day: "Thu", title: "Rest & Stretch", description: "Active recovery walk and full-body stretch routine." },
        { day: "Fri", title: "Full Body Strength C", description: "Front Squats: 3x10\nDumbbell Rows: 3x10\nDumbbell Shoulder Press: 3x10\nPush-ups: 3x max\nBicep Curls: 3x12" },
        { day: "Sat", title: "Conditioning & HIIT", description: "20 min kettlebell circuit\nJump rope: 5x1 min\nCool down and foam rolling" },
        { day: "Sun", title: "Rest Day", description: "Complete rest, hydration, and nutrition." }
      ]);
    } else if (presetType === "fatloss") {
      setPlanDays([
        { day: "Mon", title: "HIIT & Upper Body Circuit", description: "Dumbbell Thrusters: 4x12\nPush-ups: 4x15\nMountain Climbers: 4x30s\nBattle Ropes: 4x30s\nRest 90s between sets" },
        { day: "Tue", title: "Lower Body Conditioning", description: "Goblet Squats: 4x15\nKettlebell Swings: 4x20\nBox Jumps / Step-ups: 4x12\nWall Sit: 3x45s" },
        { day: "Wed", title: "Steady State Cardio & Core", description: "40 min brisk incline treadmill walk or elliptical\nPlank: 4x45s\nBicycle Crunches: 4x25" },
        { day: "Thu", title: "Active Rest & Yoga", description: "Light stretching, yoga flow, or 30 min outdoor walk." },
        { day: "Fri", title: "Full Body Metabolic Circuit", description: "Burpees: 4x10\nDumbbell Renegade Rows: 4x12\nWalking Lunges: 4x15/leg\nJumping Jacks: 4x60s" },
        { day: "Sat", title: "Endurance Cardio", description: "45 mins jogging, cycling, or swimming\nCore cooldown stretch" },
        { day: "Sun", title: "Rest & Meal Prep", description: "Full rest day. Review weekly progress and nutrition." }
      ]);
    }
  };

  const handleOpenSetPlan = () => {
    if (clientRoutine && Array.isArray(clientRoutine.days) && clientRoutine.days.length === 7) {
      setPlanDays(clientRoutine.days);
    } else {
      applyPreset("ppl");
    }
    setActivePlanDayIndex(0);
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!selectedClientId) return;
    const isValid = planDays.every(d => d.title.trim() !== "");
    if (!isValid) {
      alert("Please provide at least a workout title for all 7 days.");
      return;
    }

    setSavingPlan(true);
    try {
      const res = await apiFetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          days: planDays
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPlanModal(false);
        await loadClientData(selectedClientId);
        await loadDashboardData();
        alert(`Workout plan successfully assigned and activated for ${selectedClient?.name || "Client"}!`);
      } else {
        alert(data.error || "Failed to save workout plan.");
      }
    } catch (err) {
      alert("Error saving workout plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  // Trainer Updates Progress (Check/Tick/Cross/Reset)
  const handleTrainerUpdateProgress = async (
    isCompleted: boolean | null,
    dateString: string,
    scheduledDay?: any
  ) => {
    if (!selectedClientId) return;
    setActionLoading(true);
    try {
      const body = isCompleted === null
        ? { action: "delete", dateString, clientId: selectedClientId }
        : {
            clientId: selectedClientId,
            dateString,
            isCompleted,
            routineId: clientRoutine?.id,
            dayTitle: scheduledDay?.title || (isCompleted ? "Workout Done" : "Skipped Workout"),
            dayDescription: scheduledDay?.description || "",
            trainerName: trainerProfile?.name || "Coach"
          };

      const res = await apiFetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClientProgress(prev => {
          const filtered = prev.filter(p => p.dateString !== dateString);
          return isCompleted === null ? filtered : [...filtered, data.data];
        });
      } else {
        alert(data.error || "Failed to update progress.");
      }
    } catch (e) {
      alert("Error updating progress.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
    <TrainerShell>
      <div id="dashboard" className="tab-pane active space-y-2.5">
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 !py-2 !px-3.5 !mb-2">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div>
              <h1 className="card-title !text-sm sm:!text-base">Trainer Dashboard</h1>
              <p className="card-subtitle !text-[11px]">Set trainee plans and track workout consistency.</p>
            </div>
            {/* Quick Stats Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-[#0d1411] border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                {allClients.length} Trainees
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#0d1411] border border-emerald-500/20 text-[10px] font-bold text-teal-400">
                {activeRoutines.length} Active Plans
              </span>
              {pendingRequests.length > 0 && (
                <Link href="/trainer/clients" className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-bold text-amber-300 animate-pulse flex items-center gap-1">
                  <span>⚡</span> {pendingRequests.length} Requests
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Trainee:</span>
            <select 
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-[#0e1713] border border-emerald-500/25 rounded-lg px-2.5 py-1 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer min-w-[200px]"
            >
              {allClients.length === 0 ? (
                <option value="">No clients found</option>
              ) : (
                allClients.map(c => {
                  const hasRoutine = activeRoutines.some(r => r.userId === c.id);
                  const hasReq = pendingRequests.some(r => r.userId === c.id);
                  const statusTag = hasRoutine ? "✓ Plan Active" : hasReq ? "⚡ Request" : "No Plan";
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} ({statusTag})
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>

        {selectedClientId ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
            {/* Left: Client Routine */}
            <div className="card flex flex-col justify-between !py-2.5 !px-3.5 !mb-0 h-full">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h2 className="card-title !text-xs sm:!text-sm" style={{ color: 'var(--brand-primary)' }}>
                    Assigned 7-Day Routine
                  </h2>
                  <p className="card-subtitle !text-[10px] text-slate-400">
                    For <span className="text-white font-medium">{selectedClient?.name || "Client"}</span>
                  </p>
                </div>
                <button 
                  onClick={handleOpenSetPlan}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>✏️</span> {clientRoutine ? "Edit Plan" : "Set Plan"}
                </button>
              </div>

              {progressLoading ? (
                <div className="flex-1 flex items-center justify-center p-8 text-slate-500 italic text-xs">Updating routine view...</div>
              ) : clientRoutine ? (
                <div className="space-y-2">
                  <div className="max-h-[285px] overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                    {clientRoutine.days.map((d: any, i: number) => {
                      const isToday = d.day === todayDayName;
                      const todayProg = isToday ? getDayProgress(today) : null;

                      return (
                        <div key={i} className={`p-2.5 rounded-lg border transition-all ${isToday ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20' : 'bg-[#0d1411]/90 border-emerald-500/15 hover:border-emerald-500/40'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isToday ? 'bg-emerald-500 text-black' : 'bg-[#121c17] text-emerald-400 border border-emerald-500/20'}`}>{d.day}</span>
                              <h4 className="text-white font-semibold text-xs sm:text-sm">{d.title || "Rest Day"}</h4>
                            </div>

                            {/* Today's interactive quick checkbox for Trainer */}
                            {isToday && (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-300 select-none bg-[#090e0c] px-2 py-0.5 rounded border border-emerald-500/20">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(todayProg?.isCompleted)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleTrainerUpdateProgress(true, todayDateString, d);
                                      } else {
                                        handleTrainerUpdateProgress(null, todayDateString, d);
                                      }
                                    }}
                                    disabled={actionLoading}
                                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                  />
                                  <span>{todayProg?.isCompleted ? "Done ✓" : "Done?"}</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleTrainerUpdateProgress(false, todayDateString, d)}
                                  disabled={actionLoading}
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition-all ${
                                    todayProg && !todayProg.isCompleted
                                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                      : 'bg-[#121c17] text-slate-400 border-emerald-500/20 hover:text-red-400'
                                  }`}
                                  title="Mark as skipped"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                          {d.description && <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 font-mono">{d.description}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-emerald-500/20 rounded-xl bg-[#090e0c]/50">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg mb-2">
                    📋
                  </div>
                  <h3 className="text-white font-bold text-xs sm:text-sm mb-1">
                    No Active Routine for {selectedClient?.name || "Client"}
                  </h3>
                  <p className="text-slate-400 text-[11px] max-w-xs mb-3">
                    {pendingRequests.some(r => r.userId === selectedClientId)
                      ? "⚡ This client has requested a personalized workout plan!"
                      : "Assign a personalized 7-day routine so your client can track their progress."}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={handleOpenSetPlan}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(0,200,150,0.3)] flex items-center gap-1.5"
                    >
                      <span>➕</span> Set 7-Day Workout Plan
                    </button>
                    <Link
                      href="/trainer/messages"
                      className="px-3.5 py-1.5 bg-[#121c17] hover:bg-[#1a2821] border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-lg transition-all"
                    >
                      Message Client
                    </Link>
                  </div>
                </div>
              )}

              {/* History Section */}
              {prevRoutines.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between group"
                  >
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                      Previous ({prevRoutines.length})
                    </h3>
                    <svg 
                      className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-all ${showHistory ? 'rotate-180' : ''}`} 
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  <div className={`mt-2 space-y-1.5 overflow-hidden transition-all duration-300 ${showHistory ? 'max-h-[220px] overflow-y-auto custom-scrollbar opacity-100' : 'max-h-0 opacity-0'}`}>
                    {prevRoutines.map((pr) => (
                      <button 
                        key={pr.id}
                        onClick={() => setClientRoutine(pr)}
                        className="w-full p-2 rounded-lg border border-emerald-500/15 bg-[#121c17]/60 hover:bg-[#1a2821] transition-all text-left flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-300">Routine from {new Date(pr.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-500">{pr.days[0]?.title || "Day 1"} & more...</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">View</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Client Progress Calendar */}
            <div id="progress-tracker-card" className="card h-full flex flex-col justify-between !py-2.5 !px-3.5 !mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h2 className="card-title !text-xs sm:!text-sm" style={{ color: 'var(--brand-primary)' }}>
                    Progress Tracker
                  </h2>
                  <p className="card-subtitle !text-[10px] text-slate-400">Consistency for {selectedClient?.name || "Client"}</p>
                </div>

                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span><span className="text-slate-400">Done</span></div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500"></span><span className="text-slate-400">Skip</span></div>
                </div>
              </div>

              <div className="bg-[#090e0c] border border-emerald-500/20 rounded-xl p-2.5 sm:p-3 flex flex-col max-w-[460px] w-full mx-auto">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-white font-bold text-xs sm:text-sm">
                     {new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                   </h3>
                   <div className="flex gap-1.5">
                      <button onClick={() => setViewMonth(m => m === 0 ? 11 : m - 1)} className="p-1 rounded bg-[#0e1713] border border-emerald-500/20 hover:border-emerald-500/50 text-slate-300 transition-colors" title="Previous month">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                      <button onClick={() => setViewMonth(m => m === 11 ? 0 : m + 1)} className="p-1 rounded bg-[#0e1713] border border-emerald-500/20 hover:border-emerald-500/50 text-slate-300 transition-colors" title="Next month">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-emerald-400/80 py-0.5">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((d, i) => {
                    if (!d) return <div key={i} className="h-7 sm:h-8"></div>;
                    const prog = getDayProgress(d.date);
                    const isFuture = d.date > today;
                    const isTodayBox = d.date.toDateString() === today.toDateString();

                    let boxClass = "bg-[#0d1411] border border-emerald-500/15 text-slate-300 hover:border-emerald-400/60 hover:bg-[#131f19]";
                    if (prog) {
                      boxClass = prog.isCompleted 
                        ? "bg-emerald-500 border-none shadow-[0_0_8px_rgba(0,200,150,0.4)] text-black font-extrabold" 
                        : "bg-red-500/90 border-none shadow-[0_0_8px_rgba(239,68,68,0.35)] text-white font-extrabold";
                    } else if (isFuture) {
                      boxClass = "bg-[#0d1411]/60 border border-emerald-500/10 text-slate-400 hover:border-emerald-400/50 hover:bg-[#131f19]";
                    }

                    return (
                      <button 
                        key={i} 
                        onClick={() => handleDayClick(d.date)}
                        title={prog ? (prog.isCompleted ? 'Completed' : 'Skipped') : 'Click to view / update schedule'} 
                        className={`h-7 sm:h-8 rounded-md flex items-center justify-center text-[11px] sm:text-xs font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 ${boxClass} ${isTodayBox && !prog ? 'ring-2 ring-emerald-400 border-emerald-400 text-emerald-300 font-bold bg-emerald-500/10' : ''}`}
                      >
                        <span>{d.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-emerald-500/20">
             <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl mb-2">🏋️‍♂️</div>
             <h2 className="text-base font-bold text-white mb-1">Welcome Coach</h2>
             <p className="text-slate-400 max-w-xs text-xs mb-3">No clients found on the platform yet. Once clients register, you can assign workout routines and monitor their daily consistency.</p>
             <Link href="/trainer/events" className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg shadow-[0_0_12px_rgba(0,200,150,0.3)]">
               Host a Fitness Event
             </Link>
          </div>
        )}
      </div>
    </TrainerShell>

    {/* Day Detail Modal for Trainer */}
    {selectedDate && (
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
        onClick={handleCloseModal}
      >
        <div 
          className="w-full max-w-md bg-[#090e0c] border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const d = selectedDate!;
            const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
            const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
            const prog = getDayProgress(d);
            const scheduledDay = clientRoutine?.days?.find((x: any) => x.day === dow);

            return (
              <>
                <div className="p-5 border-b border-emerald-500/15 flex justify-between items-start bg-[#070b09]/80">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                      {d.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Trainee: <span className="text-white font-semibold">{selectedClient?.name || "Client"}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="rounded-full p-1.5 bg-[#121c17] text-slate-400 hover:bg-[#1a2821] hover:text-white transition-colors border border-emerald-500/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="p-5 bg-[#090e0c] space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between bg-[#0d1411] p-3 rounded-xl border border-emerald-500/20">
                    <span className="text-xs text-slate-400 font-medium">Status:</span>
                    {prog ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        prog.isCompleted 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(0,200,150,0.3)]' 
                          : 'bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      }`}>
                        {prog.isCompleted ? '✓ Completed by Trainee' : '✕ Skipped by Trainee'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-[#121c17] text-slate-400 border-emerald-500/20">
                        ⏳ Schedule Not Yet Completed
                      </span>
                    )}
                  </div>

                  {/* Scheduled Routine Section */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Scheduled Workout</span>
                    <h4 className="text-white font-bold text-sm sm:text-base">
                      {scheduledDay?.title || prog?.dayTitle || (clientRoutine ? "Rest Day" : "No Plan Assigned")}
                    </h4>
                  </div>

                  {/* Interactive Checkbox for Trainer */}
                  <div className="bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Mark Schedule for Trainee:
                      </span>
                      {actionLoading && <span className="text-[10px] text-emerald-400 animate-pulse font-semibold">Updating...</span>}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(prog?.isCompleted)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleTrainerUpdateProgress(true, ds, scheduledDay);
                            } else {
                              handleTrainerUpdateProgress(null, ds, scheduledDay);
                            }
                          }}
                          disabled={actionLoading}
                          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {prog?.isCompleted ? "Marked Done ✓" : "Check to mark Done"}
                        </span>
                      </label>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTrainerUpdateProgress(false, ds, scheduledDay)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            prog && !prog.isCompleted
                              ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                              : 'bg-[#121c17] text-slate-400 border-emerald-500/20 hover:text-red-400 hover:border-red-500/30'
                          }`}
                        >
                          ✕ Skip
                        </button>

                        {prog && (
                          <button
                            type="button"
                            onClick={() => handleTrainerUpdateProgress(null, ds, scheduledDay)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#121c17] border border-emerald-500/20 text-slate-400 hover:text-white hover:bg-[#1a2821] transition-all"
                            title="Reset status"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Plan Details */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Exercise Plan Details</span>
                    {(scheduledDay?.description || prog?.dayDescription) ? (
                      <div className="bg-[#070b09] border border-emerald-500/20 rounded-xl p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                        {scheduledDay?.description || prog?.dayDescription}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic p-3 bg-[#070b09] rounded-xl border border-emerald-500/15">
                        {clientRoutine ? "Rest day. No exercises scheduled." : "No plan created yet for this client."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#070b09]/80 border-t border-emerald-500/15 flex justify-end">
                  <button 
                    onClick={handleCloseModal} 
                    className="px-5 py-2 bg-[#121c17] hover:bg-[#1a2821] text-white border border-emerald-500/20 text-xs font-bold rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    )}

    {/* Set / Edit 7-Day Workout Plan Modal */}
    {showPlanModal && (
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
        onClick={() => setShowPlanModal(false)}
      >
        <div 
          className="w-full max-w-xl bg-[#090e0c] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-emerald-500/15 flex items-center justify-between bg-[#070b09]/80">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>📋</span> Set 7-Day Workout Plan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assigning schedule to <span className="text-emerald-400 font-semibold">{selectedClient?.name || "Client"}</span>
              </p>
            </div>
            <button
              onClick={() => setShowPlanModal(false)}
              className="rounded-full p-1.5 bg-[#121c17] text-slate-400 hover:bg-[#1a2821] hover:text-white transition-colors border border-emerald-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
            {/* Quick Template Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Quick Template Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("ppl")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0e1713] hover:bg-[#15231c] border border-emerald-500/30 text-emerald-400 transition-all"
                >
                  ⚡ Push / Pull / Legs
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("fullbody")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0e1713] hover:bg-[#15231c] border border-emerald-500/30 text-emerald-400 transition-all"
                >
                  🏋️ Full Body Strength
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("fatloss")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0e1713] hover:bg-[#15231c] border border-emerald-500/30 text-emerald-400 transition-all"
                >
                  🔥 Fat Loss & HIIT
                </button>
              </div>
            </div>

            {/* 7 Days Tab Selector */}
            <div className="grid grid-cols-7 gap-1 bg-[#070b09] p-1.5 rounded-xl border border-emerald-500/20">
              {planDays.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setActivePlanDayIndex(i)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    activePlanDayIndex === i
                      ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(0,200,150,0.4)]'
                      : d.title.trim()
                        ? 'bg-[#121c17] text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-[#121c17]'
                  }`}
                >
                  {d.day}
                </button>
              ))}
            </div>

            {/* Active Day Editor */}
            <div className="bg-[#0d1411] border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Editing: {planDays[activePlanDayIndex].day}
                </span>
                <span className="text-[10px] text-slate-500">Day {activePlanDayIndex + 1} of 7</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Workout Title / Focus
                </label>
                <input
                  type="text"
                  value={planDays[activePlanDayIndex].title}
                  onChange={(e) => {
                    const updated = [...planDays];
                    updated[activePlanDayIndex].title = e.target.value;
                    setPlanDays(updated);
                  }}
                  placeholder="e.g. Chest & Triceps, Leg Day, Rest Day"
                  className="w-full bg-[#070b09] border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Exercise Details & Instructions
                </label>
                <textarea
                  rows={6}
                  value={planDays[activePlanDayIndex].description}
                  onChange={(e) => {
                    const updated = [...planDays];
                    updated[activePlanDayIndex].description = e.target.value;
                    setPlanDays(updated);
                  }}
                  placeholder="List exercises, sets, reps, and notes:&#10;1. Bench Press: 4 sets x 8-10 reps&#10;2. Incline Dumbbell Press: 3 sets x 10 reps&#10;3. Tricep Pushdowns: 3 sets x 15 reps"
                  className="w-full bg-[#070b09] border border-emerald-500/30 rounded-lg p-3 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 custom-scrollbar resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  disabled={activePlanDayIndex === 0}
                  onClick={() => setActivePlanDayIndex(i => Math.max(0, i - 1))}
                  className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white disabled:opacity-30"
                >
                  ← Previous Day
                </button>
                <button
                  type="button"
                  disabled={activePlanDayIndex === 6}
                  onClick={() => setActivePlanDayIndex(i => Math.min(6, i + 1))}
                  className="px-3 py-1 rounded text-xs text-emerald-400 hover:text-emerald-300 font-semibold disabled:opacity-30"
                >
                  Next Day →
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[#070b09]/80 border-t border-emerald-500/15 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowPlanModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#121c17] border border-emerald-500/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-[0_0_15px_rgba(0,200,150,0.4)] disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingPlan ? "Saving & Assigning..." : "Assign & Activate Plan ✓"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
