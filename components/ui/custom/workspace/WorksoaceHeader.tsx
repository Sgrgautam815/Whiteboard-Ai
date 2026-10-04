"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Save, Share, Pencil, Check, X, Loader2, ArrowLeft, Copy, Users, Lock, Eye, Radio, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import axios from 'axios';
import { OnlineUser } from '@/hooks/useCollaboration';
import { LiveRoomModal } from './LiveRoomModal';
import { ThemeSwitcher } from '../ThemeSwitcher';

type Props = {
  selectedTab: (value: string) => void;
  onExport: () => void;
  onSave?: () => void;
  projectName: string;
  projectId?: string;
  roomId?: string;
  isOwner?: boolean;
  onProjectRename?: (newName: string) => void;
  collabStatus?: "live" | "reconnecting" | "offline";
  onlineUsers?: OnlineUser[];
  userPermission?: "edit" | "view";
  onPermissionChange?: (perm: "edit" | "view") => void;
  onEndRoom?: () => void;
};

function WorksoaceHeader({
  selectedTab,
  onExport,
  onSave,
  projectName,
  projectId,
  roomId,
  isOwner = false,
  onProjectRename,
  collabStatus = "live",
  onlineUsers = [],
  userPermission = "edit",
  onPermissionChange,
  onEndRoom,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName || "Untitled Board");
  const [liveRoomModalOpen, setLiveRoomModalOpen] = useState(false);
  const [savingProjectName, setSavingProjectName] = useState(false);

  React.useEffect(() => {
    setTitleInput(projectName || "Untitled Board");
  }, [projectName]);

  const handleSaveTitle = async () => {
    const cleaned = titleInput.trim();
    if (!cleaned || cleaned === projectName || !projectId) {
      setIsEditing(false);
      return;
    }

    try {
      setSavingProjectName(true);
      await axios.put('/api/projects', {
        projectId,
        action: 'rename',
        projectName: cleaned,
      });

      onProjectRename?.(cleaned);
      toast.add({
        title: "Board Renamed",
        description: `Renamed to "${cleaned}".`,
        type: "success",
      });
    } catch (err) {
      toast.add({
        title: "Error renaming board",
        description: "Failed to rename workspace.",
        type: "error",
      });
    } finally {
      setSavingProjectName(false);
      setIsEditing(false);
    }
  };

  const getStatusBadge = () => {
    if (collabStatus === "live") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      );
    }
    if (collabStatus === "reconnecting") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          Reconnecting...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        Offline
      </span>
    );
  };

  return (
    <>
      <div className="p-3 border-b bg-white flex items-center justify-between gap-4 shadow-sm">
        {/* Left: Back Link, Logo & Project Name */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>

          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="White Board logo" className="h-9 w-9 rounded-xl object-cover" />
          </Link>

          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="rounded-lg border border-blue-400 px-2.5 py-1 text-sm font-semibold text-slate-800 outline-none ring-2 ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                disabled={savingProjectName}
                className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-700"
              >
                {savingProjectName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md bg-slate-200 p-1.5 text-slate-700 hover:bg-slate-300"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
              <h2 className="text-base font-bold text-slate-800 hover:text-blue-600 transition">
                {projectName || "Untitled Board"}
              </h2>
              <Pencil size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
          )}

          {/* Connection Status Badge */}
          {getStatusBadge()}
        </div>

        {/* Center: Switch Tabs */}
        <div>
          <Tabs defaultValue="whiteBoard" onValueChange={(value) => selectedTab(value)}>
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="whiteBoard" className="rounded-lg text-xs font-semibold px-4">
                Whiteboard
              </TabsTrigger>
              <TabsTrigger value="doc" className="rounded-lg text-xs font-semibold px-4">
                Smart Doc
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right: Actions, Online Collaborators & Live Room Button */}
        <div className="flex items-center gap-3">
          {/* Online Collaborator Avatar Stack */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center -space-x-2 overflow-hidden px-1">
              {onlineUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.socketId || i}
                  title={`${u.name || "Collaborator"} (${u.permission || "edit"})`}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm ring-1 ring-slate-200"
                  style={{ backgroundColor: u.color || "#2563eb" }}
                >
                  {(u.name || "C").charAt(0).toUpperCase()}
                </div>
              ))}
              {onlineUsers.length > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-white border-2 border-white shadow-sm">
                  +{onlineUsers.length - 4}
                </div>
              )}
            </div>
          )}

          {/* User Permission Mode Badge */}
          {userPermission === "view" ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200">
              <Eye size={14} /> View Only
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={onSave}
              className="bg-blue-600 text-white hover:bg-blue-700 gap-1.5 rounded-xl text-xs font-semibold shadow-sm"
            >
              <Save size={15} /> Save
            </Button>
          )}

          {/* Live Room / Share Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLiveRoomModalOpen(true)}
            className="border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 gap-2 rounded-xl text-xs font-bold shadow-sm"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 Live Room</span>
            {onlineUsers.length > 0 && (
              <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                {onlineUsers.length}
              </span>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onExport}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Download size={15} /> Export
          </Button>
        </div>
      </div>

      {/* Dedicated Live Room Window / Modal */}
      <LiveRoomModal
        isOpen={liveRoomModalOpen}
        onClose={() => setLiveRoomModalOpen(false)}
        roomId={roomId}
        boardId={projectId || ""}
        projectName={projectName}
        onlineUsers={onlineUsers}
        collabStatus={collabStatus}
        userPermission={userPermission}
        isOwner={isOwner}
        onPermissionChange={onPermissionChange}
        onEndRoom={onEndRoom}
      />
    </>
  );
}

export default WorksoaceHeader;
