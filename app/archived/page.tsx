import ProjectList from '@/components/ui/custom/projectList';
import React from 'react';

function ArchivedPage() {
  return (
    <div>
      <ProjectList isArchivedView={true} />
    </div>
  );
}

export default ArchivedPage;
