"use client";

import { Folder } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CreateNewBoardDialog from './createNewBoardDialog';
import axios from 'axios';
import moment from 'moment';

type Project = {
  id: number;
  projectName: string;
  projectId: string;
  previewImage: string | null;
  updatedAt: string | null;
  createdAt?: string | null;
  userEmail: string;
};

function ProjectList() {
  const [projectList, setProjectList] = useState<Project[]>([]);

  useEffect(() => {
    GetProjectList();
  }, []);

  const GetProjectList = async () => {
    const result = await axios.get('/api/projects');
    console.log(result.data);
    setProjectList(result.data);
  };

  return (
    <div>
      {projectList.length === 0 ? (
        <div className="p-20 m-20 flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
          <Image src="/flames.png" alt="folder" width={90} height={90} className="mx-auto mb-4" />    
          <h2 className="mt-3 text-2xl font-semibold">No projects found</h2>
          <p className="mt-2 text-sm text-gray-500 text-muted-foreground">
            Create a new project to get started.
          </p>
          <CreateNewBoardDialog />
        </div>
      ) : (
        <div className="px-6 py-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Boards</h2>
            <p className="mt-1 text-sm text-slate-500">Create, Organize and continue working on your ideas</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projectList.map((project: Project, index: number) => (
              <div
                key={project.projectId || index}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/workspace/${project.projectId}`}
                  className="block cursor-pointer"
                >
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
                      <Folder aria-label="Project" className="h-10 w-10 text-slate-400 transition group-hover:text-slate-500" />
                      <span className="text-sm font-medium text-slate-400">Empty Whiteboard</span>
                    </div>
                  )}

                  <div className="min-h-[76px] border-t border-slate-100 p-4">
                    <h2 className="truncate text-sm font-semibold text-slate-800">
                      {project.projectName}
                    </h2>
                    <p className="mt-1 text-xs text-gray-400">
                      {'Edited ' + moment(project.updatedAt || project.createdAt).fromNow()}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
