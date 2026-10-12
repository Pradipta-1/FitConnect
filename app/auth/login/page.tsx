"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "USER" | "TRAINER" | "ORGANIZER" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const starContainerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = starContainerRef.current;
    if (!container) return;

    const count = 150;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";
      const size = Math.random() * 2 + 1;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.setProperty("--duration", Math.random() * 3 + 2 + "s");
      star.style.animationDelay = Math.random() * 5 + "s";
      if (Math.random() > 0.8) star.style.background = "#00c896";
      container.appendChild(star);
    }

    return () => {
      container.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const container = starContainerRef.current;
    if (!container) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function triggerShootingStar() {
      if (cancelled) return;
      const c = starContainerRef.current;
      if (!c) return;
      const shooter = document.createElement("div");
      shooter.className = "shooting-star";
      shooter.style.left = Math.random() * 80 + "%";
      shooter.style.top = Math.random() * 40 + "%";
      c.appendChild(shooter);
      timeouts.push(setTimeout(() => shooter.remove(), 3000));
      timeouts.push(setTimeout(triggerShootingStar, Math.random() * 4000 + 3000));
    }

    timeouts.push(setTimeout(triggerShootingStar, 2000));

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned error (${res.status}): ${res.statusText || "Unable to reach database"}`);
      }
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Invalid email or password");
      }
      // Store the token in sessionStorage (per-tab) so each tab maintains
      // its own independent session, even if another tab logs in simultaneously
      if (data.token) {
        sessionStorage.setItem("auth_token", data.token);
      }
      const role = (data.data?.role || "USER") as Role;
      const redirect =
        role === "TRAINER"
          ? "/trainer/dashboard"
          : role === "ORGANIZER"
            ? "/organizer/dashboard"
            : role === "ADMIN"
              ? "/admin/dashboard"
              : "/user/dashboard";
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        :root {
          --brand-primary: #00c896;
          --brand-dark: #0a0a0a;
          --text-main: #ffffff;
          --text-dim: #a1a1aa;
          --glass-bg: rgba(18, 18, 18, 0.8);
          --glass-border: rgba(255, 255, 255, 0.08);
        }
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #151515 0%, #000 100%);
          color: var(--text-main);
          overflow: hidden;
        }
        #star-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle var(--duration) ease-in-out infinite;
        }
        .shooting-star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 1), transparent);
          box-shadow: 0 0 10px white;
          animation: shoot 3s linear infinite;
          opacity: 0;
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        @keyframes shoot {
          0% {
            transform: translateX(0) translateY(0) rotate(-45deg) scaleX(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
            transform: translateX(0) translateY(0) rotate(-45deg) scaleX(50);
          }
          20% {
            transform: translateX(500px) translateY(500px) rotate(-45deg) scaleX(50);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 450px;
          border-radius: 26px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
          padding: 50px 40px;
        }
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .login-logo-icon {
          /* SVG logo */
        }
        .login-logo-text {
          font-size: 1.4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00f5a0 0%, #00d2ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 10px rgba(0, 245, 160, 0.3));
          font-family: 'Arial Black', -apple-system, sans-serif;
          letter-spacing: -0.01em;
        }
        .login-title {
          font-size: 34px;
          font-weight: 800;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          font-size: 15px;
          color: var(--text-dim);
          margin-bottom: 40px;
        }
        .login-field {
          margin-bottom: 24px;
        }
        .login-label {
          font-size: 12px;
          color: var(--brand-primary);
          margin-bottom: 8px;
          display: block;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.1em;
        }
        .login-input {
          width: 100%;
          padding: 16px 18px;
          border-radius: 14px;
          border: 1px solid #2a2a2a;
          background: rgba(0, 0, 0, 0.3);
          color: white;
          font-size: 15px;
          outline: none;
          transition: all 0.3s ease;
        }
        .login-input:focus {
          border-color: var(--brand-primary);
          background: rgba(0, 200, 150, 0.03);
          box-shadow: 0 0 0 4px rgba(0, 200, 150, 0.1);
        }
        .login-btn {
          margin-top: 10px;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          background: var(--brand-primary);
          color: #000;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 200, 150, 0.3);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-footer {
          margin-top: 25px;
          font-size: 14px;
          color: var(--text-dim);
          text-align: center;
        }
        .login-footer a {
          color: var(--brand-primary);
          text-decoration: none;
          font-weight: 600;
        }
        .login-footer a:hover {
          text-decoration: underline;
        }
        .login-error {
          font-size: 13px;
          color: #f87171;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="login-page">
        <div id="star-container" ref={starContainerRef} />

        <div className="login-container">
          <div className="login-logo">
            <div className="login-logo-icon">
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
            <h2 className="login-logo-text">FitConnect</h2>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">
            Log in to access your workouts, trainers, and fitness community.
          </p>

          <form onSubmit={handleSubmit}>
            {error && <p className="login-error">{error}</p>}

            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="athlete@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          <div className="login-footer">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register">Sign up</Link>
          </div>
        </div>
      </div>
    </>
  );
}
