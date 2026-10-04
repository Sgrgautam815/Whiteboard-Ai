"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/nextjs";

export type OnlineUser = {
  socketId: string;
  id?: string;
  name?: string;
  email?: string;
  color?: string;
  permission?: "edit" | "view";
  isOwner?: boolean;
  joinedAt?: number;
};

export type CollaboratorCursor = {
  socketId: string;
  user: OnlineUser;
  x: number;
  y: number;
  timestamp: number;
};

export type CollaborationState = {
  status: "live" | "reconnecting" | "offline";
  onlineUsers: OnlineUser[];
  cursors: Map<string, CollaboratorCursor>;
  selectedElementsMap: Map<string, string[]>; // socketId -> elementIds
  permission: "edit" | "view";
};

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "http://localhost:3001";

export function useCollaboration(
  boardId: string | null | undefined,
  initialPermission: "edit" | "view" = "edit",
  onRemoteElementsChange?: (elements: any[], senderName?: string, isAiGenerated?: boolean) => void,
) {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<"live" | "reconnecting" | "offline">("offline");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, CollaboratorCursor>>(new Map());
  const [selectedElementsMap, setSelectedElementsMap] = useState<Map<string, string[]>>(new Map());

  const lastBroadcastRef = useRef<number>(0);

  useEffect(() => {
    if (!boardId) return;

    const userInfo = {
      id: user?.id || `anon-${Math.random().toString(36).substr(2, 6)}`,
      name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Collaborator",
      email: user?.primaryEmailAddress?.emailAddress || "",
      avatar: user?.imageUrl || "/default-profile.png",
    };

    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("live");
      socket.emit("join-room", {
        boardId,
        user: userInfo,
        permission: initialPermission,
      });
    });

    socket.on("reconnect_attempt", () => {
      setStatus("reconnecting");
    });

    socket.on("disconnect", () => {
      setStatus("offline");
    });

    socket.on("connect_error", () => {
      setStatus("offline");
    });

    socket.on("presence-update", (data: { onlineUsers: OnlineUser[] }) => {
      if (Array.isArray(data?.onlineUsers)) {
        setOnlineUsers(data.onlineUsers);
      }
    });

    socket.on("elements-change", (data: { elements: any[]; senderName?: string; isAiGenerated?: boolean }) => {
      if (Array.isArray(data?.elements)) {
        onRemoteElementsChange?.(data.elements, data.senderName, data.isAiGenerated);
      }
    });

    socket.on("cursor-update", (data: CollaboratorCursor) => {
      if (!data?.socketId || data.socketId === socket.id) return;
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(data.socketId, data);
        return next;
      });
    });

    socket.on("selection-update", (data: { socketId: string; selectedElementIds: string[] }) => {
      if (!data?.socketId || data.socketId === socket.id) return;
      setSelectedElementsMap((prev) => {
        const next = new Map(prev);
        next.set(data.socketId, data.selectedElementIds || []);
        return next;
      });
    });

    return () => {
      socket.emit("leave-room", { boardId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId, user, initialPermission]);

  // Clean up stale cursors (remove cursors inactive for > 4s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, cursor] of next.entries()) {
          if (now - cursor.timestamp > 4000) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const broadcastElementsChange = useCallback(
    (elements: readonly any[], isAiGenerated = false) => {
      if (!socketRef.current || !boardId || initialPermission === "view") return;
      socketRef.current.emit("elements-change", {
        boardId,
        elements,
        isAiGenerated,
      });
    },
    [boardId, initialPermission],
  );

  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!socketRef.current || !boardId) return;
      const now = Date.now();
      // Throttle cursor movement broadcasts to 50ms (20fps)
      if (now - lastBroadcastRef.current > 50) {
        lastBroadcastRef.current = now;
        socketRef.current.emit("cursor-move", {
          boardId,
          x,
          y,
        });
      }
    },
    [boardId],
  );

  const broadcastSelection = useCallback(
    (selectedElementIds: string[]) => {
      if (!socketRef.current || !boardId) return;
      socketRef.current.emit("selection-change", {
        boardId,
        selectedElementIds,
      });
    },
    [boardId],
  );

  return {
    status,
    onlineUsers,
    cursors: Array.from(cursors.values()),
    selectedElementsMap,
    broadcastElementsChange,
    broadcastCursor,
    broadcastSelection,
  };
}
