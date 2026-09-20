import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  if (!projectId) {
    notFound();
  }

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.projectId, projectId))
    .limit(1);

  const workspace = project[0];

  if (!workspace) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Workspace
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{workspace.projectName}</h1>
        <p className="mt-3 text-sm text-slate-500">Project ID: {workspace.projectId}</p>
        <p className="mt-3 text-slate-600">
          Your new board has been created successfully.
        </p>
      </div>
    </main>
  );
}
