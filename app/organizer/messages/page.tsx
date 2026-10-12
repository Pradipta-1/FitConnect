import { Suspense } from "react";
import OrganizerShell from "@/components/OrganizerShell";
import MessagesView from "@/components/MessagesView";

export default function OrganizerMessagesPage() {
  return (
    <OrganizerShell>
      <div id="messages" className="w-full">
        <Suspense fallback={<div className="p-4 text-slate-400">Loading messages...</div>}>
          <MessagesView />
        </Suspense>
      </div>
    </OrganizerShell>
  );
}
