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
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import CreateNewBoardDialog from "./createNewBoardDialog";

export function AppSidebar() {
  const path = usePathname();
  const {user} = useUser();

  const menuItems = [
    { label: "All files", href: "/dashboard", icon: LayoutGrid },
    { label: "Shared", href: "/shared-files", icon: FolderOpen },
    { label: "Archived", href: "/archived", icon: Archive },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="Logo" width={70} height={70} />
          <h2 className="text-lg font-bold">White Board</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
          <CreateNewBoardDialog />
        <div className="my-4 border-t" />
        <SidebarGroup>
          <SidebarGroupLabel>My boards</SidebarGroupLabel>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>My boards</SidebarGroupLabel>

          {menuItems.map(({ label, href, icon: Icon }) => (
            <SidebarMenuButton key={href} isActive={path === href}>
              <Icon />
              <span>{label}</span>
            </SidebarMenuButton>
          ))}
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenuButton className="p-5" isActive={path === "/other"}>
            <Sparkles />
            <span>AI helper</span>
          </SidebarMenuButton>
          <SidebarMenuButton className="p-5" isActive={path === "/settings"}>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
            <CreateNewBoardDialog />
          <div className="p-4 my-3 border rounded-md " >      
            <h2 className="text-sm flex justify-between"> 2 files created<span> total 3</span></h2>
            <progress value={66} className="h-2 mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <img
              src={user?.imageUrl ?? "/default-profile.png"}
              alt="User profile"
              width={50}
              height={50}
              className="h-[50px] w-[50px] rounded-full border border-gray-200 object-cover"
            />
            <h2 className="text-sm font-medium">
              {user?.firstName ?? "User"} {user?.lastName ?? ""}
            </h2>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}