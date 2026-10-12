"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "TRAINER" | "USER";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("TRAINER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".auth-star-container");
    if (!container) return;

    container.innerHTML = "";

    const count = 150;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "auth-star";
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty("--duration", `${Math.random() * 3 + 2}s`);
      star.style.animationDelay = `${Math.random() * 5}s`;
      if (Math.random() > 0.8) star.style.background = "#00c896";
      container.appendChild(star);
    }

    let timeoutId: number;
    const triggerShootingStar = () => {
      const shooter = document.createElement("div");
      shooter.className = "auth-shooting-star";
      shooter.style.left = `${Math.random() * 80}%`;
      shooter.style.top = `${Math.random() * 40}%`;
      container.appendChild(shooter);
      setTimeout(() => shooter.remove(), 3000);
      timeoutId = window.setTimeout(triggerShootingStar, Math.random() * 4000 + 3000);
    };

    timeoutId = window.setTimeout(triggerShootingStar, 2000);
    return () => {
      window.clearTimeout(timeoutId);
      container.innerHTML = "";
    };
  }, []);

  const title = useMemo(
    () => (mode === "TRAINER" ? "Elevate Your Coaching" : "Commit to Greatness"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "TRAINER"
        ? "Build your brand, manage clients, and grow your fitness empire on the world's most advanced platform."
        : "Find elite trainers and access personalized programs designed to unlock your physical potential.",
    [mode]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const role = mode === "TRAINER" ? "TRAINER" : "USER";
      const specializations = extra ? extra.split(",").map(s => s.trim()).filter(Boolean) : [];
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role, specializations })
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned error (${res.status}): ${res.statusText || "Unable to reach database"}`);
      }
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Registration failed");
      }
      if (data.token) {
        sessionStorage.setItem("auth_token", data.token);
      }
      router.push(mode === "TRAINER" ? "/trainer/dashboard" : "/user/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setName("");
    setEmail("");
    setPassword("");
    setExtra("");
    setError(null);
  }

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setExtra("");
    setError(null);
  }, []);

  return (
    <main className="auth-shell">
      <div className="auth-star-container" />
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" fill="url(#gradient)" stroke="#00f5a0" strokeWidth="2.5"/>
              <text x="30" y="38" textAnchor="middle" fill="#060907" fontSize="19" fontWeight="900" fontFamily="Arial Black, system-ui, sans-serif">FC</text>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#00f5a0'}}/>
                  <stop offset="100%" style={{stopColor:'#00d2ff'}}/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="auth-logo-text">FitConnect</h2>
        </div>
        <div className="flex justify-center">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === "TRAINER" ? "auth-tab-active" : ""}`}
              onClick={() => switchMode("TRAINER")}
            >
              Trainer
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "USER" ? "auth-tab-active" : ""}`}
              onClick={() => switchMode("USER")}
            >
              Trainee
            </button>
          </div>
        </div>

        <h1 className="auth-title text-center">{title}</h1>
        <p className="auth-subtitle text-center mx-auto">{subtitle}</p>

        <div className={`auth-panel ${mode === "TRAINER" ? "auth-panel-active" : ""}`}>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Hidden dummy fields to prevent aggressive browser autofill */}
            <input type="text" name="prevent_autofill_username" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="prevent_autofill_password" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />

            <div className="auth-field">
              <label className="auth-label">Full Professional Name</label>
              <input
                className="auth-input"
                type="text"
                name="trainer_full_name"
                autoComplete="off"
                placeholder="e.g. Rahul Mehta"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Work Email</label>
              <input
                className="auth-input"
                type="email"
                name="trainer_work_email"
                autoComplete="new-password"
                placeholder="coach@fitness.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                name="trainer_account_password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Primary Specialization</label>
              <input
                className="auth-input"
                type="text"
                name="trainer_specialization"
                autoComplete="off"
                placeholder="Hypertrophy, HIIT, Nutrition"
                value={extra}
                onChange={e => setExtra(e.target.value)}
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`auth-submit auth-submit-primary ${loading ? "opacity-70" : ""}`}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-side">
            <h3 className="auth-side-title">The Trainer Advantage</h3>
            <ul>
              <li className="auth-side-item">
                <span className="auth-side-icon">✓</span>
                <span>
                  <b>Premium Profile:</b> Showcase certifications and client results.
                </span>
              </li>
              <li className="auth-side-item">
                <span className="auth-side-icon">✓</span>
                <span>
                  <b>Global Reach:</b> Connect with trainees beyond your local gym.
                </span>
              </li>
              <li className="auth-side-item">
                <span className="auth-side-icon">✓</span>
                <span>
                  <b>Secure Payments:</b> Automated billing and session tracking.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`auth-panel ${mode === "USER" ? "auth-panel-active" : ""}`}>
          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Hidden dummy fields to prevent aggressive browser autofill */}
            <input type="text" name="prevent_autofill_trainee_username" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="prevent_autofill_trainee_password" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />

            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                className="auth-input"
                type="text"
                name="trainee_full_name"
                autoComplete="off"
                placeholder="e.g. Anita Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                className="auth-input"
                type="email"
                name="trainee_email"
                autoComplete="new-password"
                placeholder="anita@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Secure Password</label>
              <input
                className="auth-input"
                type="password"
                name="trainee_account_password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">What is your #1 Goal?</label>
              <input
                className="auth-input"
                type="text"
                name="trainee_goal"
                autoComplete="off"
                placeholder="Build muscle, Lose fat, etc."
                value={extra}
                onChange={e => setExtra(e.target.value)}
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`auth-submit auth-submit-secondary ${loading ? "opacity-70" : ""}`}
            >
              {loading ? "Creating account..." : "Start My Transformation"}
            </button>
          </form>

          <div className="auth-side">
            <h3 className="auth-side-title">Your Journey Starts Here</h3>
            <ul>
              <li className="auth-side-item">
                <span className="auth-side-icon">✓</span>
                <span>
                  <b>Vetted Coaches:</b> Access to top-tier verified fitness experts.
                </span>
              </li>
              <li className="auth-side-item">
                <span className="auth-side-icon">✓</span>
                <span>
                  <b>Custom Plans:</b> Workouts tailored to your specific body type.
                </span>
              </li>
              <li className="auth-side-item">
                <span className="auth-side-icon">✓</span>
                <span>
                  <b>Track Progress:</b> Integrated logs for your lifts and meals.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-emerald-400 font-semibold hover:underline ms-1">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

