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

function CreateNewBoardDialog() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const router = useRouter();

  const handleCreateBoard = async () => {
    const cleanedName = workspaceName.trim();

    if (!cleanedName || cleanedName.length > 30) {
      toast.add({
        title: 'Invalid Workspace Name',
        description: 'Please enter a valid workspace name (1-30 characters).',
        type: 'error',
      });
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create workspace.');
      }

      const createdProjectId = data?.projectId || projectId;

      toast.add({
        title: 'Workspace Created',
        description: `${cleanedName} is ready to use.`,
        type: 'success',
      });

      setWorkspaceName('');
      setDialog(false);

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
      <DialogTrigger className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600">
        <span className="flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Board
        </span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Start a new workspace for your next idea.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Enter Workspace Name</label>
          <input
            type="text"
            placeholder="Workspace Name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <DialogFooter>
          <DialogClose className="rounded border px-3 py-2 text-sm">
            Cancel
          </DialogClose>

          <button
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={workspaceName.trim().length === 0 || loading}
            onClick={handleCreateBoard}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateNewBoardDialog;
