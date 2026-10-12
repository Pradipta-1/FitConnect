"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ReportItem = {
  id: string;
  reason: string;
  details?: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedUserId?: string | null;
  postId?: string | null;
  eventId?: string | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      const res = await apiFetch("/api/admin/reports");
      const json = await res.json();
      if (json.success) {
        setReports(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleUpdateStatus(id: string, status: "RESOLVED" | "DISMISSED") {
    try {
      const res = await apiFetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const json = await res.json();
      if (json.success) {
        setReports(prev =>
          prev.map(r => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-amber-300 bg-clip-text text-transparent">
          Moderation & Reports Queue
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review community flags, content reports, and take moderation action.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0d1411]/90 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Report Queue</h2>
          <span className="text-xs text-slate-400">
            {loading ? "Loading..." : `${reports.length} Total Reports`}
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            🎉 Clean moderation queue! No reports or user flags pending review.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {reports.map((report) => (
              <div key={report.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{report.reason}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        report.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : report.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  {report.details && (
                    <p className="text-xs text-slate-300">{report.details}</p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Reported by {report.reporter.name} ({report.reporter.email}) on{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {report.status === "PENDING" && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleUpdateStatus(report.id, "RESOLVED")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, "DISMISSED")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
