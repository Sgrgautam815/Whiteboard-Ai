import ProjectList from '@/components/ui/custom/projectList';
import React from 'react';

function SharedPage() {
  return (
    <div>
      <ProjectList isSharedView={true} />
    </div>
  );
}

export default SharedPage;
