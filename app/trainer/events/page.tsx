"use client";

import TrainerShell from "@/components/TrainerShell";
import EventsView from "@/components/EventsView";

export default function TrainerEventsPage() {
  return (
    <TrainerShell>
      <div className="py-2 sm:py-3">
        <EventsView role="TRAINER" />
      </div>
    </TrainerShell>
  );
}
