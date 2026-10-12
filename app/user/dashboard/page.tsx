'use client';

import { useEffect, useState } from 'react';
import UserShell from '@/components/UserShell';
import { apiFetch } from '@/lib/apiFetch';

type ActiveRoutine = {
  id: string;
  days: { day: string; title: string; description: string }[];
  trainer: {
    name: string;
  };
  createdAt: string;
};

type DailyProgress = {
  id: string;
  dateString: string;
  isCompleted: boolean;
  routineId?: string;
  dayTitle?: string;
  dayDescription?: string;
  trainerName?: string;
};

export default function UserDashboardPage() {
  const [activeRoutine, setActiveRoutine] = useState<ActiveRoutine | null>(null);
  const [allRoutines, setAllRoutines] = useState<any[]>([]);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Calendar Modal State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");

  const todayVal = new Date();
  const today = todayVal; 
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [showPicker, setShowPicker] = useState(false);
  const [showStreakHistory, setShowStreakHistory] = useState(false);

  // Today helpers
  const todayDateString = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0]; // YYYY-MM-DD
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDayName = daysOfWeek[today.getDay()];

  useEffect(() => {
    async function loadData() {
      try {
        const [activeRoutineRes, allRoutinesRes, progressRes] = await Promise.all([
          apiFetch('/api/routines?active=true'),
          apiFetch('/api/routines'),
          apiFetch('/api/progress')
        ]);

        const activeRoutineData = await activeRoutineRes.json();
        const allRoutinesData = await allRoutinesRes.json();
        const progressData = await progressRes.json();

        if (activeRoutineData.success && activeRoutineData.data && activeRoutineData.data.length > 0) {
          setActiveRoutine(activeRoutineData.data[0]);
          setSelectedRoutineId(activeRoutineData.data[0].id);
        }
        if (allRoutinesData.success) {
          setAllRoutines(allRoutinesData.data ?? []);
        }
        if (progressData.success) {
          setProgress(progressData.data ?? []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const calculateStreak = () => {
    if (progress.length === 0) return 0;
    
    // Sort descending by date
    const sorted = [...progress].sort((a, b) => b.dateString.localeCompare(a.dateString));
    
    let streak = 0;
    const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const yesterday = new Date(today.getTime() - today.getTimezoneOffset() * 60000 - 86400000);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const hasTodayCompleted = sorted.find(p => p.dateString === todayStr && p.isCompleted);
    const hasTodaySkipped = sorted.find(p => p.dateString === todayStr && p.isCompleted === false);
    const hasYesterdayCompleted = sorted.find(p => p.dateString === yesterdayStr && p.isCompleted);

    let currentCheck = "";
    if (hasTodayCompleted) {
      currentCheck = todayStr;
    } else if (!hasTodaySkipped && hasYesterdayCompleted) {
      currentCheck = yesterdayStr;
    }

    if (!currentCheck) return 0;

    const getPrevStr = (ds: string) => {
      const d = new Date(ds);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split("T")[0];
    };

    while (true) {
      const found = sorted.find(p => p.dateString === currentCheck);
      if (found && found.isCompleted) {
        streak++;
        currentCheck = getPrevStr(currentCheck);
      } else {
        break;
      }
    }
    return streak;
  };

  const getStreakHistory = () => {
    if (progress.length === 0) return [];
    const sorted = [...progress].sort((a, b) => a.dateString.localeCompare(b.dateString));
    
    const streaks: { start: string; end: string; count: number }[] = [];
    let currentStreak: { start: string; end: string; count: number } | null = null;
    let lastDate: Date | null = null;

    for (const rec of sorted) {
      if (!rec.isCompleted) {
        if (currentStreak && currentStreak.count >= 5) {
          streaks.push(currentStreak);
        }
        currentStreak = null;
        lastDate = null;
        continue;
      }

      const currentDate = new Date(rec.dateString + "T00:00:00Z");
      if (!lastDate) {
        currentStreak = { start: rec.dateString, end: rec.dateString, count: 1 };
      } else {
        const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
        if (diffDays === 1) {
          currentStreak!.count++;
          currentStreak!.end = rec.dateString;
        } else {
          if (currentStreak && currentStreak.count >= 5) {
            streaks.push(currentStreak);
          }
          currentStreak = { start: rec.dateString, end: rec.dateString, count: 1 };
        }
      }
      lastDate = currentDate;
    }
    if (currentStreak && currentStreak.count >= 5) {
      streaks.push(currentStreak);
    }
    return streaks.reverse(); // Newest first
  };

  const streakHistory = getStreakHistory();

  const currentStreak = calculateStreak();

  const handleUpdateProgress = async (
    isCompleted: boolean | null,
    routineData?: { routineId: string; dayTitle: string; dayDescription: string; trainerName: string },
    targetDateString?: string
  ) => {
    setActionLoading(true);
    const ds = targetDateString || todayDateString;
    try {
      const body = isCompleted === null 
        ? { action: "delete", dateString: ds }
        : { dateString: ds, isCompleted, ...routineData };

      const res = await apiFetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local state
        setProgress(prev => {
          const filtered = prev.filter(p => p.dateString !== ds);
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

  const handleRequestContinual = async () => {
    const trainerRef = allRoutines.find(r => r.isArchived)?.trainerId;
    if (!trainerRef) return;

    setActionLoading(true);
    try {
      const res = await apiFetch("/api/routines/request-continual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId: trainerRef })
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
      setActionLoading(false);
    }
  };

  const todayProgress = progress.find(p => p.dateString === todayDateString);

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDay + 1;
    if (dayNumber > 0 && dayNumber <= daysInMonth) {
      const d = new Date(viewYear, viewMonth, dayNumber);
      return { date: d, dayNumber };
    }
    return null;
  });

  const getDayProgress = (d: Date) => {
    const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    return progress.find(p => p.dateString === ds);
  };

  const handleDayClick = (dayDate: Date | null) => {
    if (dayDate) {
      setSelectedDate(dayDate);
    }
  };

  return (
    <UserShell>
      <div id="dashboard" className="tab-pane active">
        {/* Compact Header */}
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 !py-2 !px-3.5 !mb-2.5">
          <div>
            <h1 className="card-title !text-sm sm:!text-base">User Dashboard</h1>
            <p className="card-subtitle !text-[11px]">
              Welcome back! Here is a summary of your fitness journey.
            </p>
          </div>
          {currentStreak > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-2.5 py-1 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-base">🔥</span>
              <div>
                <p className="text-orange-400 font-bold text-[10px] leading-none">STREAK: {currentStreak} DAYS</p>
                <p className="text-slate-300 text-[9px]">Keep up the consistency!</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
          {/* Active Routine Section */}
          <div className="card h-full !py-2.5 !px-3.5 !mb-0 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="card-title !text-xs sm:!text-sm" style={{ color: 'var(--brand-primary)' }}>
                Your Active 7-Day Routine
              </h2>
              {activeRoutine && (
                <span className="text-[10px] text-slate-400">
                  By <span className="font-semibold text-emerald-400">{activeRoutine.trainer?.name || "Trainer"}</span>
                </span>
              )}
            </div>

            {loading ? (
              <p className="card-subtitle text-xs mt-2">Loading routine...</p>
            ) : activeRoutine ? (
              <div className="flex-1 flex flex-col">
                <div className="max-h-[285px] overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                  {activeRoutine.days.map((d, i) => {
                    const isToday = d.day === todayDayName;
                    return (
                      <div key={i} className={`rounded-lg p-2.5 transition-all ${isToday ? 'border-emerald-500/60 shadow-[0_0_12px_rgba(0,200,150,0.15)] ring-1 ring-emerald-500/30 bg-emerald-500/10 border' : 'bg-[#0d1411]/90 border border-emerald-500/15 hover:border-emerald-500/40'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold w-12 text-center ${isToday ? 'bg-emerald-500 text-black' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
                              {d.day}
                            </span>
                            <h3 className="text-white text-xs sm:text-sm font-semibold flex-1">
                              {d.title || "Rest"}
                              {isToday && <span className="ml-2 text-[10px] text-emerald-400 font-bold uppercase px-1.5 py-0.2 rounded border border-emerald-500/40 bg-emerald-500/10">Today</span>}
                            </h3>
                          </div>

                          {/* Progress Input for Today */}
                          {isToday && (
                            <div className="flex items-center gap-1.5">
                              {todayProgress?.isCompleted === true ? (
                                <button 
                                  onClick={() => handleUpdateProgress(null)}
                                  disabled={actionLoading}
                                  className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-md shadow-emerald-500/30 hover:bg-emerald-400 transition-all disabled:opacity-50"
                                  title="Mark as undone"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateProgress(true, { 
                                    routineId: activeRoutine.id, 
                                    dayTitle: d.title || "Rest", 
                                    dayDescription: d.description || "",
                                    trainerName: activeRoutine.trainer?.name || "Unknown"
                                  })}
                                  disabled={actionLoading}
                                  className="w-7 h-7 rounded-full bg-[#121c17] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                                  title="Complete workout"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </button>
                              )}

                              {todayProgress?.isCompleted === false ? (
                                <button 
                                  onClick={() => handleUpdateProgress(null, {} as any)}
                                  disabled={actionLoading}
                                  className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/30 hover:bg-red-600 transition-all disabled:opacity-50"
                                  title="Reset status"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateProgress(false, { 
                                    routineId: activeRoutine.id, 
                                    dayTitle: d.title || "Rest", 
                                    dayDescription: d.description || "",
                                    trainerName: activeRoutine.trainer?.name || "Unknown"
                                  })}
                                  disabled={actionLoading}
                                  className="w-7 h-7 rounded-full bg-[#121c17] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                  title="Skip workout"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {d.description && (
                          <p className={`text-xs whitespace-pre-wrap font-mono mt-1.5 sm:pl-[58px] ${isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                            {d.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                <p className="text-slate-400 text-xs sm:text-sm mb-4">
                  {allRoutines.some(r => r.isArchived && !r.isActive) 
                    ? "Your routine has been discontinued. Ready to get back to it?"
                    : "No active routine currently. Visit the Trainers tab to request one!"}
                </p>
                {allRoutines.some(r => r.isArchived && !r.isActive) && (
                  <button 
                    onClick={handleRequestContinual}
                    disabled={actionLoading}
                    className="rounded-lg bg-orange-500 px-6 py-2 text-xs font-bold text-white hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
                  >
                    Request Continual
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Monthly Calendar Section */}
          <div className="card h-full !py-2.5 !px-3.5 !mb-0 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <h2 className="card-title !text-xs sm:!text-sm" style={{ color: 'var(--brand-primary)' }}>
                  Progress Calendar
                </h2>
                <p className="card-subtitle !text-[10px] text-slate-400">Track workout consistency</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStreakHistory(true)}
                  className="px-2 py-0.5 rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[10px] font-bold hover:bg-orange-500/20 transition-all flex items-center gap-1"
                >
                  <span>🔥</span> Streaks
                </button>
              </div>
            </div>

            <div className="bg-[#090e0c] border border-emerald-500/20 rounded-xl p-2.5 sm:p-3 overflow-hidden shadow-inner max-w-[460px] w-full mx-auto">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 group px-2 py-0.5 rounded-md bg-[#0e1713] border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-[#131f19] transition-all text-left"
                >
                  <h3 className="text-white font-bold text-xs sm:text-sm group-hover:text-emerald-400 transition-colors">
                    {new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-400 transition-all"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <div className="flex gap-2.5 text-[10px] font-medium">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span><span className="text-slate-400">Done</span></div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500"></span><span className="text-slate-400">Skipped</span></div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-emerald-400/80 py-0.5">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, i) => {
                  if (!d) return <div key={i} className="h-7 sm:h-8 rounded bg-transparent"></div>;

                  const isFuture = d.date > today;
                  const isTodayBox = d.date.toDateString() === today.toDateString();
                  const prog = getDayProgress(d.date);

                  let boxClass = "bg-[#0d1411] border border-emerald-500/15 hover:border-emerald-400/60 hover:bg-[#131f19] text-slate-200";
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
                      className={`h-7 sm:h-8 rounded-md flex items-center justify-center text-[11px] sm:text-xs font-semibold transition-all ${boxClass} ${isTodayBox && !prog ? 'ring-2 ring-emerald-400 border-emerald-400 text-emerald-300 font-bold bg-emerald-500/10' : ''} cursor-pointer hover:scale-105 hover:z-10`}
                    >
                      {d.dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routine Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#090e0c] border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {(() => {
              const dow = daysOfWeek[selectedDate.getDay()];
              const ds = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
              const routineDay = activeRoutine?.days?.find(d => d.day === dow);
              const prog = getDayProgress(selectedDate);
              const isToday = ds === todayDateString;

              return (
                <>
                  <div className="p-6 border-b border-emerald-500/15 flex justify-between items-start bg-[#070b09]/80">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      {prog ? (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${prog.isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                          {prog.isCompleted ? 'Completed' : 'Skipped'}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#121c17] text-slate-400 border-emerald-500/20">
                          Unrecorded
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="rounded-full p-2 bg-[#121c17] text-slate-400 hover:bg-[#1a2821] hover:text-white transition-colors border border-emerald-500/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <div className="p-5 bg-[#090e0c] flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    {/* Scheduled Routine Header */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Scheduled Workout</span>
                      <h4 className="text-white font-bold text-base sm:text-lg">
                        {routineDay?.title || prog?.dayTitle || (activeRoutine ? "Rest Day" : "No Routine Scheduled")}
                      </h4>
                      {(activeRoutine?.trainer?.name || prog?.trainerName) && (
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">
                          Assigned by Coach {activeRoutine?.trainer?.name || prog?.trainerName}
                        </p>
                      )}
                    </div>

                    {/* Checkbox & Status Toggle Box */}
                    <div className="bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(prog?.isCompleted)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleUpdateProgress(true, {
                                routineId: activeRoutine?.id || prog?.routineId || "",
                                dayTitle: routineDay?.title || prog?.dayTitle || "Workout",
                                dayDescription: routineDay?.description || prog?.dayDescription || "",
                                trainerName: activeRoutine?.trainer?.name || prog?.trainerName || "Coach"
                              }, ds);
                            } else {
                              handleUpdateProgress(null, {} as any, ds);
                            }
                          }}
                          disabled={actionLoading}
                          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {prog?.isCompleted ? "Completed ✓" : "Check to mark complete"}
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateProgress(false, {
                            routineId: activeRoutine?.id || prog?.routineId || "",
                            dayTitle: routineDay?.title || prog?.dayTitle || "Skipped Workout",
                            dayDescription: routineDay?.description || prog?.dayDescription || "",
                            trainerName: activeRoutine?.trainer?.name || prog?.trainerName || "Coach"
                          }, ds)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            prog && !prog.isCompleted
                              ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                              : 'bg-[#121c17] text-slate-400 border-emerald-500/20 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'
                          }`}
                        >
                          ✕ Skip
                        </button>

                        {prog && (
                          <button
                            type="button"
                            onClick={() => handleUpdateProgress(null, {} as any, ds)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#121c17] border border-emerald-500/20 text-slate-400 hover:text-white hover:bg-[#1a2821] transition-all"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Exercise Details */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Exercise Details</span>
                      {(routineDay?.description || prog?.dayDescription) ? (
                        <div className="bg-[#070b09] border border-emerald-500/20 rounded-xl p-3.5 max-h-[35vh] overflow-y-auto custom-scrollbar">
                          <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {routineDay?.description || prog?.dayDescription}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic p-3 bg-[#070b09] rounded-xl border border-emerald-500/15">
                          {activeRoutine ? "Rest & recovery day. No heavy exercises scheduled." : "No workout plan assigned for this day."}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Month/Year Context Picker */}
      {showPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-[#090e0c] border border-emerald-500/20 rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">Select Month & Year</h3>
                <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Month</label>
                  <select 
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value))}
                    className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const isDisabled = viewYear === today.getFullYear() && i > today.getMonth();
                      return (
                        <option key={i} value={i} disabled={isDisabled}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Year</label>
                  <select 
                    value={viewYear}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      setViewYear(newYear);
                      // Adjust month if the new year makes current month invalid (future)
                      if (newYear === today.getFullYear() && viewMonth > today.getMonth()) {
                        setViewMonth(today.getMonth());
                      }
                    }}
                    className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = today.getFullYear() - i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>

                <button 
                  onClick={() => setShowPicker(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-2"
                >
                  View History
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Streak History Modal */}
      {showStreakHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#090e0c] border border-emerald-500/20 rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🔥</span> Streak History
              </h3>
              <button onClick={() => setShowStreakHistory(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {streakHistory.length > 0 ? (
                streakHistory.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const endDate = new Date(s.end + "T00:00:00Z");
                      setViewMonth(endDate.getUTCMonth());
                      setViewYear(endDate.getUTCFullYear());
                      setShowStreakHistory(false);
                    }}
                    className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {new Date(s.start + "T00:00:00Z").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(s.end + "T00:00:00Z").toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-white font-bold text-lg group-hover:text-orange-400 transition-colors">{s.count} Day Streak</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No streaks of 5+ days found yet.</p>
                  <p className="text-slate-600 text-[10px] mt-1">Keep working out to build your first one!</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowStreakHistory(false)}
              className="w-full bg-[#121c17] hover:bg-[#1a2821] text-white font-bold py-3 rounded-xl border border-emerald-500/20 transition-all mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #182620;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </UserShell>
  );
}
