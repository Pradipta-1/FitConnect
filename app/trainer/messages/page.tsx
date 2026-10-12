import { Suspense } from "react";
import TrainerShell from "@/components/TrainerShell";
import MessagesView from "@/components/MessagesView";

export default function TrainerMessagesPage() {
  return (
    <TrainerShell>
      <div id="messages" className="w-full">
        <Suspense fallback={<div className="p-4 text-slate-400">Loading messages...</div>}>
          <MessagesView />
        </Suspense>
      </div>
    </TrainerShell>
  );
}
