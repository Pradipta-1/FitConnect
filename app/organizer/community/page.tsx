"use client";

import { useEffect, useState } from "react";
import OrganizerShell from "@/components/OrganizerShell";
import CommunityFeed from "@/components/CommunityFeed";
import { apiFetch } from "@/lib/apiFetch";

export default function OrganizerCommunityPage() {
  const [hasNewPosts, setHasNewPosts] = useState(false);

  useEffect(() => {
    const lastViewed = localStorage.getItem('fitconnect_community_viewed');
    apiFetch('/api/notifications/unread-status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.latestPostAt) {
          if (!lastViewed || new Date(data.data.latestPostAt) > new Date(lastViewed)) {
            setHasNewPosts(true);
          }
        }
      })
      .catch(() => {});

    const timer = setTimeout(() => {
      localStorage.setItem('fitconnect_community_viewed', new Date().toISOString());
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OrganizerShell>
      <div className="py-2 sm:py-3 max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Event Community</h1>
            {hasNewPosts && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" title="New unseen posts" />
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Stay updated with what participants and trainers are sharing.</p>
        </div>
        <CommunityFeed />
      </div>
    </OrganizerShell>
  );
}
