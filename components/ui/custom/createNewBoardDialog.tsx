import React, { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

type CreateNewBoardDialogProps = {
  onBoardCreated?: () => void;
  triggerText?: string;
  className?: string;
};

function CreateNewBoardDialog({ onBoardCreated, triggerText = 'Create New Board', className }: CreateNewBoardDialogProps) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const router = useRouter();

  const handleCreateBoard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanedName = workspaceName.trim() || 'Untitled Board';

    setLoading(true);

    try {
      const projectId = crypto.randomUUID();
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          projectName: cleanedName,
        }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Response was empty or non-JSON
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Failed to create workspace (${response.status})`);
      }

      const createdProjectId = data?.projectId || projectId;

      toast.add({
        title: 'Workspace Created',
        description: `"${cleanedName}" is ready to use.`,
        type: 'success',
      });

      setWorkspaceName('');
      setDialog(false);

      if (onBoardCreated) {
        onBoardCreated();
      }

      if (createdProjectId) {
        router.push(`/workspace/${createdProjectId}`);
      }
    } catch (error) {
      toast.add({
        title: 'Unable to create workspace',
        description: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialog} onOpenChange={setDialog}>
      <DialogTrigger className={`w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] ${className || ''}`}>
        <span className="flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          {triggerText}
        </span>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleCreateBoard}>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Start a new workspace for your next idea.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Enter Workspace Name</label>
            <input
              type="text"
              placeholder="Workspace Name (e.g., Marketing Strategy)"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <DialogFooter>
            <DialogClose className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Cancel
            </DialogClose>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </span>
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateNewBoardDialog;
