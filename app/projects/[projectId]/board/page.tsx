const cols = [
  { key: 'OPEN', title: 'Open' },
  { key: 'IN_PROGRESS', title: 'In Progress' },
  { key: 'BLOCKED', title: 'Blocked' },
  { key: 'DONE', title: 'Done' },
];

async function fetchTasks(projectId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/projects/${projectId}/tasks`, { cache: 'no-store' });
  if (!res.ok) return { OPEN: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] } as any;
  return res.json();
}

export default async function Board({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await fetchTasks(projectId).catch(() => ({ OPEN: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] }));
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cols.map((c) => (
        <div key={c.key} className="bg-panel border border-border rounded-md p-2">
          <div className="text-xs font-semibold mb-2">{c.title}</div>
          <div className="space-y-2">
            {(data[c.key as keyof typeof data] as any[]).map((t) => (
              <div key={t.id} className="bg-subtle rounded px-2 py-1.5 text-sm border border-border/60">
                {t.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


