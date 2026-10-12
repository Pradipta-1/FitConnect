import type { ReactNode } from "react";
import OrganizerShell from "@/components/OrganizerShell";

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

