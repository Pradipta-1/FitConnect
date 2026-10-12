import { Suspense } from "react";
import MessagesView from "@/components/MessagesView";
import UserShell from "@/components/UserShell";

export default function UserMessagesPage() {
  return (
    <UserShell>
      <div id="messages" className="w-full">
        <Suspense fallback={<div className="p-4 text-slate-400">Loading messages...</div>}>
          <MessagesView />
        </Suspense>
      </div>
    </UserShell>
  );
}
