"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiFetch';

type Props = {
  children: ReactNode;
};

export default function UserShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatarUrl?: string | null } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiFetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch user in side shell:", err);
      }
    }
    fetchUser();

    function createStarfield() {
      const container = document.getElementById('star-container');
      if (!container) return;

      container.querySelectorAll('.star, .shooting-star').forEach((el) => el.remove());

      const count = 100;

      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        const size = Math.random() * 2 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';

        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';

        star.style.setProperty('--duration', String(Math.random() * 3 + 2) + 's');
        star.style.animationDelay = String(Math.random() * 5) + 's';

        if (Math.random() > 0.85) star.style.background = '#00c896';

        container.appendChild(star);
      }
    }

    let shootingCleanup: (() => void) | null = null;

    function triggerShootingStar() {
      const container = document.getElementById('star-container');
      if (!container) return;

      const shooter = document.createElement('div');
      shooter.className = 'shooting-star';

      shooter.style.left = Math.random() * 80 + '%';
      shooter.style.top = Math.random() * 40 + '%';

      container.appendChild(shooter);

      const removeTimeout = window.setTimeout(() => shooter.remove(), 3000);
      const nextTimeout = window.setTimeout(triggerShootingStar, Math.random() * 4000 + 3000);

      shootingCleanup = () => {
        window.clearTimeout(removeTimeout);
        window.clearTimeout(nextTimeout);
      };
    }

    createStarfield();
    const firstTimeout = window.setTimeout(triggerShootingStar, 2000);

    return () => {
      window.clearTimeout(firstTimeout);
      if (shootingCleanup) shootingCleanup();
    };
  }, []);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnseenCommunity, setHasUnseenCommunity] = useState(false);

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await apiFetch('/api/notifications/unread-status');
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.unreadMessages > 0 || data.data.unreadNotifications > 0) {
            setHasUnreadMessages(true);
          }
          if (data.data.hasUnseenCommunity && pathname !== '/user/community') {
            setHasUnseenCommunity(true);
          } else if (!data.data.hasUnseenCommunity) {
            setHasUnseenCommunity(false);
          }
        }
      } catch (err) {
        // silent catch
      }
    }
    checkNotifications();

    if (pathname === '/user/community') {
      apiFetch('/api/community/view', { method: 'POST' }).catch(() => {});
      setHasUnseenCommunity(false);
    }
    if (pathname === '/user/messages') {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/auth/login");
  };

  const navLinks = [
    { href: "/user/dashboard", label: "Dashboard" },
    { href: "/user/events", label: "Events" },
    { href: "/user/trainers", label: "Trainers" },
    { href: "/user/community", label: "Community", hasBadge: hasUnseenCommunity },
    { href: "/user/messages", label: "Messages", hasBadge: hasUnreadMessages },
    { href: "/user/profile-settings", label: "Profile & Settings" },
  ];

  return (
    <>
      <div id="star-container" />

      <div className="app-container">
        <nav className="top-nav">
          <div className="nav-brand flex items-center gap-2 sm:gap-2.5 min-w-0">
            <img
              src="/logo.png"
              alt="FitConnect"
              className="w-7 h-7 min-w-[28px] rounded-full object-cover shadow-[0_0_12px_rgba(0,200,150,0.4)] flex-shrink-0"
            />
            {user && (
              <div className="w-7 h-7 min-w-[28px] rounded-full overflow-hidden border border-emerald-500/40 flex-shrink-0 bg-[#121c17] flex items-center justify-center text-emerald-400 font-bold text-xs">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            )}
            <span className="brand-title truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-none text-xs sm:text-sm font-bold tracking-wider">
              {user ? user.name.toUpperCase() : "FITCONNECT"}
            </span>
          </div>

          {/* Desktop Nav - hidden on < 1024px */}
          <div className="nav-list hidden lg:flex items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item${pathname === link.href ? ' active' : ''}`}
              >
                <span className="flex items-center gap-1.5">
                  {link.label}
                  {link.hasBadge && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
                  )}
                </span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-all border border-red-500/20"
            >
              Logout
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2 rounded-lg border border-emerald-500/30 bg-[#121c17] text-emerald-400 hover:bg-[#1a2821] transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {(hasUnreadMessages || hasUnseenCommunity) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#090d0b] animate-pulse" />
                  )}
                </div>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-[56px] bg-black/75 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[56px] left-0 right-0 bg-[#090e0c]/98 border-b border-emerald-500/25 backdrop-blur-2xl px-4 py-4 flex flex-col gap-1.5 z-50 shadow-2xl shadow-black/90 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-[#121c17] hover:text-white'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>{link.label}</span>
                  {link.hasBadge && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
                  )}
                </span>
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-emerald-500/15">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <main className="main-content">
          {children}
        </main>
        
        <footer className="app-footer">
          &copy; 2026 FitConnect. All rights reserved.
        </footer>
      </div>

      <style jsx global>{`
        :root {
          --brand-primary: #00c896;
          --brand-primary-glow: rgba(0, 200, 150, 0.2);
          --bg-color: #060907;
          --nav-bg: rgba(9, 13, 11, 0.9);
          --text-main: #ffffff;
          --text-dim: #94a3b8;
          --glass-bg: rgba(13, 19, 16, 0.85);
          --glass-border: rgba(0, 200, 150, 0.12);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        body {
          height: 100vh;
          background: radial-gradient(circle at top left, #0d1411 0%, #050505 100%);
          color: var(--text-main);
          overflow: hidden;
          display: flex;
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
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.4);
            box-shadow: 0 0 5px var(--brand-primary);
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

        .app-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 10;
        }

        .top-nav {
          width: 100%;
          height: 56px;
          background: var(--nav-bg);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          flex-shrink: 0;
          position: relative;
          z-index: 50;
        }

        .nav-brand {
          font-size: 14px;
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .brand-title {
          background: linear-gradient(135deg, #00f5a0 0%, #00d2ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 1px 8px rgba(0, 245, 160, 0.3));
          font-family: 'Arial Black', -apple-system, sans-serif;
        }

        .nav-list {
          display: none;
          height: 100%;
          gap: 2px;
        }

        @media (min-width: 1024px) {
          .nav-list {
            display: flex !important;
          }
        }

        @media (max-width: 1023px) {
          .nav-list {
            display: none !important;
          }
          .top-nav {
            padding: 0 16px;
            height: 56px;
          }
        }

        .nav-item {
          padding: 0 14px;
          height: 100%;
          display: flex;
          align-items: center;
          color: var(--text-dim);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          border-bottom: 2px solid transparent;
        }

        .nav-item:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: var(--brand-primary);
          background: linear-gradient(to top, var(--brand-primary-glow) 0%, transparent 100%);
          border-bottom: 2px solid var(--brand-primary);
          font-weight: 600;
        }

        .main-content {
          flex: 1;
          padding: 16px 24px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 12px 14px;
          }
        }

        .card {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 14px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .card:hover {
          border-color: rgba(0, 200, 150, 0.25);
        }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .card-subtitle {
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.4;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .dashboard-small-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 14px 16px;
          transition: 0.2s;
        }
        
        .dashboard-small-card:hover {
          border-color: rgba(0,200,150,0.4);
          transform: translateY(-2px);
        }

        .action-btn {
          background: transparent;
          border: 1px solid var(--brand-primary);
          color: var(--brand-primary);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
          font-size: 12px;
          margin-top: 8px;
        }
        
        .action-btn:hover {
          background: var(--brand-primary);
          color: black;
          box-shadow: 0 0 10px var(--brand-primary);
        }

        .app-footer {
          padding: 6px 20px;
          text-align: center;
          color: var(--text-dim);
          border-top: 1px solid var(--glass-border);
          font-size: 11px;
          height: 28px;
          flex-shrink: 0;
          background: rgba(8, 12, 10, 0.6);
        }
      `}</style>
    </>
  );
}
