"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TrainerShell from "@/components/TrainerShell";
import { apiFetch } from "@/lib/apiFetch";

type Params = {
  clientId: string;
};

export default function TrainerClientPlanPage() {
  const { clientId } = useParams<Params>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await apiFetch("/api/workout-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save workout plan");
      }

      setSuccess(true);
      setTimeout(() => router.push("/trainer/clients"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save workout plan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TrainerShell>
      <div id="client-plan" className="tab-pane active">
        {/* Header card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h1 className="card-title">Set Workout Plan</h1>
          <p className="card-subtitle">
            Compose a personalised workout plan for this client. They will see
            the latest plan on their dashboard.
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "rgba(0,200,150,0.1)",
                border: "1px solid rgba(0,200,150,0.4)",
                color: "#00c896",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              Plan saved! Redirecting…
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Plan Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0a0a0c",
                  border: "1px solid #222",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                }}
                placeholder="e.g. 4-Week Strength Program"
                disabled={submitting}
                onFocus={(e) => (e.target.style.borderColor = "#00c896")}
                onBlur={(e) => (e.target.style.borderColor = "#222")}
              />
            </div>

            <div className="space-y-2">
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Plan Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 200,
                  background: "#0a0a0c",
                  border: "1px solid #222",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
                placeholder="Describe exercises, sets, reps, and weekly schedule…"
                disabled={submitting}
                onFocus={(e) => (e.target.style.borderColor = "#00c896")}
                onBlur={(e) => (e.target.style.borderColor = "#222")}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                style={{
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: 10,
                  padding: "9px 20px",
                  color: "#aaa",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !description.trim()}
                className="action-btn"
                style={{ opacity: submitting || !title.trim() || !description.trim() ? 0.5 : 1 }}
              >
                {submitting ? "Saving…" : "Save Plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TrainerShell>
  );
}
