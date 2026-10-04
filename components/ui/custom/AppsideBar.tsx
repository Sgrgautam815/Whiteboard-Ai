"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Archive, FolderOpen, LayoutGrid, Settings, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import CreateNewBoardDialog from "./createNewBoardDialog";

import React, { useState } from "react";
import { AIHelperModal } from "./AIHelperModal";

export function AppSidebar() {
  const path = usePathname();
  const { user } = useUser();
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const menuItems = [
    { label: "My boards", href: "/dashboard", icon: LayoutGrid },
    { label: "Shared", href: "/shared-files", icon: FolderOpen },
    { label: "Archived", href: "/archived", icon: Archive },
  ];

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="White Board logo" className="h-10 w-10 rounded-xl object-cover" />
            <h2 className="text-lg font-bold text-slate-900">White Board</h2>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <div className="px-2 pt-2">
            <CreateNewBoardDialog />
          </div>
          <div className="my-4 border-t border-slate-100" />

          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            {menuItems.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="w-full">
                <SidebarMenuButton isActive={path === href}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </SidebarMenuButton>
              </Link>
            ))}
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Other</SidebarGroupLabel>
            <SidebarMenuButton
              className="p-3 cursor-pointer hover:bg-slate-100"
              onClick={() => setAiModalOpen(true)}
            >
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span>AI helper</span>
            </SidebarMenuButton>

            <Link href="/settings" className="w-full">
              <SidebarMenuButton className="p-3" isActive={path === "/settings"}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3">
            <img
              src={user?.imageUrl ?? "/default-profile.png"}
              alt="User profile"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-gray-200 object-cover"
            />
            <div className="flex flex-col truncate">
              <h2 className="text-sm font-medium truncate text-slate-800">
                {user?.firstName ?? "User"} {user?.lastName ?? ""}
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <AIHelperModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </>
  );
}
