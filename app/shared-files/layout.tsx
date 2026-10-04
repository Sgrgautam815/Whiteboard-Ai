import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/custom/AppsideBar';
import React from 'react';
import AppHeader from '@/components/ui/custom/AppHeader';

function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <div className="p-5">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

export default SharedLayout;
