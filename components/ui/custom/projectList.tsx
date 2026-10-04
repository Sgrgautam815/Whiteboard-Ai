"use client";

import { Archive, Folder, Loader2, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CreateNewBoardDialog from './createNewBoardDialog';
import axios from 'axios';
import moment from 'moment';
import { toast } from '@/components/ui/toast';

type Project = {
  id: number;
  projectName: string;
  projectId: string;
  previewImage: string | null;
  updatedAt: string | null;
  createdAt?: string | null;
  userEmail: string;
  isArchived?: boolean;
};

interface ProjectListProps {
  isArchivedView?: boolean;
  isSharedView?: boolean;
}

function ProjectList({ isArchivedView = false, isSharedView = false }: ProjectListProps) {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);

  useEffect(() => {
    GetProjectList();
  }, [isArchivedView, isSharedView]);

  const GetProjectList = async () => {
    try {
      setLoading(true);
      let url = '/api/projects?archived=false';
      if (isArchivedView) {
        url = '/api/projects?archived=true';
      } else if (isSharedView) {
        url = '/api/projects?shared=true';
      }

      const result = await axios.get(url);
      setProjectList(result.data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.add({
        title: "Error fetching projects",
        description: "Could not load workspace list.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setActionProjectId(projectId);
      await axios.put('/api/projects', { projectId, action: 'archive' });
      toast.add({
        title: 'Board Archived',
        description: `"${projectName}" has been moved to Archive.`,
        type: 'success',
      });
      setProjectList((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (error) {
      toast.add({
        title: 'Error archiving board',
        description: 'Failed to archive board. Please try again.',
        type: 'error',
      });
    } finally {
      setActionProjectId(null);
    }
  };

  const handleRestore = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setActionProjectId(projectId);
      await axios.put('/api/projects', { projectId, action: 'restore' });
      toast.add({
        title: 'Board Restored',
        description: `"${projectName}" has been restored to My boards.`,
        type: 'success',
      });
      setProjectList((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (error) {
      toast.add({
        title: 'Error restoring board',
        description: 'Failed to restore board. Please try again.',
        type: 'error',
      });
    } finally {
      setActionProjectId(null);
    }
  };

  const handlePermanentDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`Are you sure you want to permanently delete "${projectName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setActionProjectId(projectId);
      await axios.delete(`/api/projects?projectId=${projectId}&permanent=true`);
      toast.add({
        title: 'Board Permanently Deleted',
        description: `"${projectName}" has been permanently removed.`,
        type: 'success',
      });
      setProjectList((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (error) {
      toast.add({
        title: 'Error deleting board',
        description: 'Failed to permanently delete board.',
        type: 'error',
      });
    } finally {
      setActionProjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {projectList.length === 0 ? (
        <div className="mx-auto my-12 max-w-lg rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-sm">
            <Sparkles className="h-9 w-9" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            {isArchivedView
              ? "No archived boards"
              : isSharedView
              ? "No shared boards yet"
              : "No projects found"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isArchivedView
              ? "Workspaces you delete will appear here so you can restore or permanently remove them."
              : isSharedView
              ? "Boards shared with you by other team members will appear here."
              : "Create a new board to get started with your ideas."}
          </p>
          {!isArchivedView && !isSharedView && (
            <div className="mt-6 flex justify-center">
              <CreateNewBoardDialog onBoardCreated={GetProjectList} />
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 py-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isArchivedView
                  ? "Archived Boards"
                  : isSharedView
                  ? "Shared With You"
                  : "Your Boards"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isArchivedView
                  ? "View, restore, or permanently remove your archived workspaces"
                  : isSharedView
                  ? "Workspaces that team members have shared with your account"
                  : "Create, organize, and continue working on your ideas"}
              </p>
            </div>
            {!isArchivedView && !isSharedView && (
              <div className="w-44">
                <CreateNewBoardDialog onBoardCreated={GetProjectList} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projectList.map((project: Project) => {
              const isActionProcessing = actionProjectId === project.projectId;

              return (
                <div
                  key={project.projectId}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link
                    href={isArchivedView ? "#" : `/workspace/${project.projectId}`}
                    className={`block ${isArchivedView ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="relative">
                      {project?.previewImage ? (
                        <img
                          src={project.previewImage}
                          alt={project.projectName}
                          width={400}
                          height={225}
                          className="aspect-video w-full bg-slate-50 object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-slate-50">
                          <Folder className="h-10 w-10 text-slate-400 transition group-hover:text-slate-500" />
                          <span className="text-sm font-medium text-slate-400">Empty Whiteboard</span>
                        </div>
                      )}

                      {/* Card Hover Quick Actions */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 transition sm:opacity-0 sm:group-hover:opacity-100">
                        {isArchivedView ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRestore(e, project.projectId, project.projectName)}
                              disabled={isActionProcessing}
                              title="Restore Board"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                            >
                              {isActionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handlePermanentDelete(e, project.projectId, project.projectName)}
                              disabled={isActionProcessing}
                              title="Delete Permanently"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-md backdrop-blur transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                            >
                              {isActionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleArchive(e, project.projectId, project.projectName)}
                            disabled={isActionProcessing}
                            title="Move to Archive"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-amber-500 hover:text-white disabled:opacity-50"
                          >
                            {isActionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 p-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold text-slate-800">
                          {project.projectName}
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                          {'Edited ' + moment(project.updatedAt || project.createdAt).fromNow()}
                        </p>
                      </div>

                      {/* Explicit Action Buttons in footer for clarity */}
                      <div className="ml-2 flex items-center gap-1">
                        {isArchivedView ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRestore(e, project.projectId, project.projectName)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handlePermanentDelete(e, project.projectId, project.projectName)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleArchive(e, project.projectId, project.projectName)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                            title="Archive Workspace"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
