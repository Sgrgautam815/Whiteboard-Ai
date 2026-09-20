import WelcomeBanner from '@/components/ui/custom/WelcomeBanner';
import ProjectList from '@/components/ui/custom/projectList';
import React from 'react';

function Dashboardpage() {
  return (
    <div>
      <WelcomeBanner />
      <ProjectList />
    </div>
  );
}

export default Dashboardpage;
