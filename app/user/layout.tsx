'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Let the new full-screen user shell handle these routes
  if (
    pathname === "/user/dashboard" ||
    pathname === "/user/events" ||
    pathname === "/user/trainers" ||
    pathname === "/user/clients" ||
    pathname === "/user/community" ||
    pathname === "/user/messages" ||
    pathname === "/user/profile-settings"
  ) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#060907] text-slate-100">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
        <aside className="w-52 space-y-2 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            User
          </p>
          <nav className="space-y-1">
            <Link href="/user/dashboard" className="block rounded px-3 py-1 hover:bg-emerald-500/10 text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/user/events" className="block rounded px-3 py-1 hover:bg-emerald-500/10 text-slate-300 hover:text-white transition-colors">
              Events
            </Link>
            <Link href="/user/trainers" className="block rounded px-3 py-1 hover:bg-emerald-500/10 text-slate-300 hover:text-white transition-colors">
              Trainers
            </Link>
            <Link href="/user/community" className="block rounded px-3 py-1 hover:bg-emerald-500/10 text-slate-300 hover:text-white transition-colors">
              Community
            </Link>
            <Link href="/user/messages" className="block rounded px-3 py-1 hover:bg-emerald-500/10 text-slate-300 hover:text-white transition-colors">
              Messages
            </Link>
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>
    </main>
  );
}

