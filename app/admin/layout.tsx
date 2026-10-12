import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
        <aside className="w-60 space-y-2 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Admin
          </p>
          <nav className="space-y-1">
            <Link href="/admin/dashboard" className="block rounded px-3 py-1 hover:bg-slate-900">
              Overview
            </Link>
            <Link href="/admin/events" className="block rounded px-3 py-1 hover:bg-slate-900">
              Approve Events
            </Link>
            <Link href="/admin/trainers" className="block rounded px-3 py-1 hover:bg-slate-900">
              Verify Trainers
            </Link>
            <Link href="/admin/reports" className="block rounded px-3 py-1 hover:bg-slate-900">
              Reports
            </Link>
            <Link href="/admin/analytics" className="block rounded px-3 py-1 hover:bg-slate-900">
              Analytics
            </Link>
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>
    </main>
  );
}

