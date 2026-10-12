export default async function AdminTrainersPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/trainers/pending`,
    { cache: "no-store" }
  ).catch(() => null);
  const data = res ? await res.json() : null;
  const trainers = data?.data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-50">Verify Trainers</h1>
      <div className="space-y-2 text-sm text-slate-300">
        {trainers.length === 0 && <p>No trainers awaiting verification.</p>}
        {trainers.map((t: any) => (
          <div
            key={t.id}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
          >
            <p className="font-semibold text-slate-50">{t.name}</p>
            <p className="text-xs text-slate-400">{t.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

