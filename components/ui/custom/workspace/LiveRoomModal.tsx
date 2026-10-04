"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Radio,
  Users,
  Copy,
  Check,
  Crown,
  Eye,
  Edit3,
  LogOut,
  X,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { OnlineUser } from "@/hooks/useCollaboration";

interface LiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  boardId: string;
  projectName: string;
  onlineUsers: OnlineUser[];
  collabStatus?: "live" | "reconnecting" | "offline";
  userPermission?: "edit" | "view";
  isOwner?: boolean;
  onPermissionChange?: (perm: "edit" | "view") => void;
  onEndRoom?: () => void;
}

export function LiveRoomModal({
  isOpen,
  onClose,
  roomId,
  boardId,
  projectName,
  onlineUsers = [],
  collabStatus = "live",
  userPermission = "edit",
  isOwner = false,
  onPermissionChange,
  onEndRoom,
}: PropsWithDefaults<LiveRoomModalProps>) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const effectiveRoomId = roomId || `room-${boardId.slice(0, 8)}`;
  const roomUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${effectiveRoomId}`
    : `/room/${effectiveRoomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    toast.add({
      title: "✓ Link copied!",
      description: "Live room invite link copied to clipboard.",
      type: "success",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    onClose();
    router.push(`/room/${effectiveRoomId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-base font-extrabold uppercase tracking-wider text-red-400">
              LIVE ROOM
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Room Name & Active Status */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {projectName || "Student Complaint Management System"}
            </h2>
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                🟢 {onlineUsers.length || 1} Active
              </span>
              <span className="text-xs text-slate-400">Room ID: {effectiveRoomId}</span>
            </div>
          </div>

          {/* Active Participants List */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Active Participants
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              {onlineUsers.length === 0 ? (
                <div className="flex items-center gap-3 p-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                    You
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">You (Current User)</span>
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <Crown size={10} /> Room Owner
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">🟢 Editing</span>
                  </div>
                </div>
              ) : (
                onlineUsers.map((u, i) => (
                  <div key={u.socketId || i} className="flex items-center justify-between rounded-lg p-2 transition hover:bg-white">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: u.color || "#2563eb" }}
                      >
                        {(u.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {u.name || "Collaborator"}
                          </span>
                          {i === 0 && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                          {(u.isOwner || (i === 0 && isOwner)) && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <Crown size={10} /> Owner
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-emerald-600 font-medium">
                          🟢 {u.permission === "view" ? "Viewing" : "Editing"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dynamic Invite Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Invite people
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <input
                type="text"
                readOnly
                value={roomUrl}
                className="flex-1 bg-transparent px-2 text-xs text-slate-700 outline-none truncate font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "✓ Link copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Permission selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Permission:
              </label>
              <span className="text-xs text-slate-500">Collaborator access right</span>
            </div>
            <select
              value={userPermission}
              onChange={(e) => onPermissionChange?.(e.target.value as "edit" | "view")}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="edit">Can edit</option>
              <option value="view">View only</option>
            </select>
          </div>

          {/* Live Sync Status */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 Live synchronization enabled</span>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {isOwner && onEndRoom ? (
              <button
                type="button"
                onClick={onEndRoom}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <ShieldAlert size={14} /> End Live Room
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleEnterRoom}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <span>Enter Live Room</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PropsWithDefaults<T> = T;
