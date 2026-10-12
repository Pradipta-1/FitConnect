import OrganizerShell from "@/components/OrganizerShell";

export default function OrganizerDashboardPage() {
  return (
    <OrganizerShell>
      <div id="dashboard" className="tab-pane active">
        <div className="card">
          <h1 className="card-title">Organizer Dashboard</h1>
          <p className="card-subtitle">
            Overview of your events, pending approvals, and upcoming activities.
          </p>
        </div>
      </div>
    </OrganizerShell>
  );
}
