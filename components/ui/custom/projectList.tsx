"use client";

import { Folder } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';

type Project = {
  id: number;
  name: string;
};

function ProjectList() {
  const [projectList, setProjectList] = useState<Project[]>([]);

  return (
    <div>
      {projectList.length === 0 ? (
        <div className="p-20 m-20 flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
          <Image src = "/flames.png" alt = "folder" width={90} height={90} className="mx-auto mb-4" />    
          <h2 className="mt-3 text-2xl font-semibold">No projects found</h2>
          <p className="mt-2 text-sm text-gray-500 text-muted-foreground">
            Create a new project to get started.
          </p>
          <button className="mt-4 rounded bg-blue-500 px-4 py-2 font-bold text-white transition hover:bg-blue-700">
            + Create New Project
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold">Project List</h2>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
