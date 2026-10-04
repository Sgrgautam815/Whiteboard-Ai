"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import WorksoaceHeader from "@/components/ui/custom/workspace/WorksoaceHeader";
import Whiteboard from "@/components/ui/custom/workspace/Whiteboard";
import { exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { toast } from "@/components/ui/toast";
import { OnlineUser } from "@/hooks/useCollaboration";
import { LiveRoomModal } from "@/components/ui/custom/workspace/LiveRoomModal";
import { Loader2, ShieldAlert, ArrowLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";

function normalizeAppState(savedAppState: any, currentAppState: any) {
  const savedCollaborators = savedAppState?.collaborators;
  const collaborators =
    savedCollaborators instanceof Map
      ? savedCollaborators
      : Array.isArray(savedCollaborators)
      ? new Map(savedCollaborators)
      : new Map();

  return {
    ...currentAppState,
    ...(savedAppState || {}),
    collaborators,
  };
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [roomStatus, setRoomStatus] = useState<"active" | "ended">("active");

  const [activeTab, setActiveTab] = useState("whiteBoard");
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  const [collabStatus, setCollabStatus] = useState<"live" | "reconnecting" | "offline">("live");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userPermission, setUserPermission] = useState<"edit" | "view">("edit");
  const [liveRoomModalOpen, setLiveRoomModalOpen] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/rooms?roomId=${roomId}`);
      const data = res.data;

      if (!data?.boardId) {
        throw new Error("Live room not found or invalid.");
      }

      setRoomData(data.room);
      setBoardId(data.boardId);
      setProjectName(data.projectName || "Live Collaboration Room");
      setIsOwner(Boolean(data.isOwner || data.isRoomCreator));
      setRoomStatus(data.status || "active");

      if (data.status === "ended") {
        setLoading(false);
        return;
      }

      // Fetch Whiteboard elements from Postgres
      if (api) {
        loadBoardData(data.boardId);
      }
    } catch (err: any) {
      console.error("Failed to load live room:", err);
      setError(err?.response?.data?.error || err?.message || "Unable to join live room.");
    } finally {
      setLoading(false);
    }
  };

  const loadBoardData = async (targetBoardId: string) => {
    try {
      const result = await axios.get(`/api/projects?projectId=${targetBoardId}`);
      if (result.data?.elements && api) {
        api.updateScene({
          elements: result.data.elements || [],
          appState: normalizeAppState(result.data.appState, api.getAppState()),
        });
      }
      if (result.data?.files && api) {
        api.addFiles(Object.values(result.data.files));
      }
    } catch (err) {
      console.error("Failed to load whiteboard content:", err);
    }
  };

  useEffect(() => {
    if (boardId && api && roomStatus === "active") {
      loadBoardData(boardId);
    }
  }, [boardId, api, roomStatus]);

  const handleManualSave = async () => {
    if (!api || !boardId || userPermission === "view") return;

    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      let base64Preview = null;
      if (elements.length > 0) {
        try {
          const blob = await exportToBlob({
            elements,
            appState: { ...appState, exportBackground: true },
            files,
            mimeType: "image/webp",
            quality: 0.5,
          });
          base64Preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {}
      }

      await axios.post("/api/whiteboard", {
        projectId: boardId,
        elements,
        appState,
        files,
        base64ImagePreview: base64Preview,
      });

      toast.add({
        title: "Board Saved",
        description: `"${projectName}" saved to database.`,
        type: "success",
      });
    } catch (err) {
      toast.add({
        title: "Save failed",
        description: "Could not save board state.",
        type: "error",
      });
    }
  };

  const handleExportImage = async () => {
    if (!api) return;
    try {
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportBackground: true },
        files: api.getFiles(),
        mimeType: "image/png",
        quality: 1,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-room.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.add({ title: "Export failed", type: "error" });
    }
  };

  const handleEndRoom = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to end this Live Room? The board will remain safe in your database."
    );
    if (!confirmed || !roomId) return;

    try {
      await axios.put("/api/rooms", { roomId, action: "end" });
      setRoomStatus("ended");
      toast.add({
        title: "Live Room Ended",
        description: "The collaboration session has been closed.",
        type: "success",
      });
    } catch (err) {
      toast.add({
        title: "Error ending room",
        description: "Failed to end live room.",
        type: "error",
      });
    }
  };

  const handleCollabStateChange = useCallback(
    (state: { status: "live" | "reconnecting" | "offline"; onlineUsers: OnlineUser[] }) => {
      setCollabStatus(state.status);
      setOnlineUsers(state.onlineUsers);
    },
    []
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">Joining Live Collaboration Room...</p>
      </div>
    );
  }

  if (error || roomStatus === "ended") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            {roomStatus === "ended" ? "Live Room Ended" : "Unable to Join Room"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {roomStatus === "ended"
              ? "This live room session has been closed by the owner. The saved diagram remains safe in your account."
              : error}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            {boardId && (
              <Link
                href={`/workspace/${boardId}`}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Open Diagram Board
              </Link>
            )}
            <Link
              href="/dashboard"
              className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <LayoutGrid size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Collaboration Room Header */}
      <WorksoaceHeader
        selectedTab={(value: string) => setActiveTab(value)}
        onExport={handleExportImage}
        onSave={handleManualSave}
        projectName={projectName}
        projectId={boardId || ""}
        onProjectRename={(newName) => setProjectName(newName)}
        collabStatus={collabStatus}
        onlineUsers={onlineUsers}
        userPermission={userPermission}
      />

      {/* Editor Canvas */}
      {activeTab === "whiteBoard" ? (
        <Whiteboard
          onApiReady={(instance: ExcalidrawImperativeAPI) => setApi(instance)}
          onCollabStateChange={handleCollabStateChange}
          userPermission={userPermission}
        />
      ) : (
        <div className="p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Smart Document</h2>
          <p className="text-slate-500 text-sm">
            Attached notes & specs for {projectName}.
          </p>
        </div>
      )}

      {/* Live Room Modal */}
      <LiveRoomModal
        isOpen={liveRoomModalOpen}
        onClose={() => setLiveRoomModalOpen(false)}
        roomId={roomId}
        boardId={boardId || ""}
        projectName={projectName}
        onlineUsers={onlineUsers}
        collabStatus={collabStatus}
        userPermission={userPermission}
        isOwner={isOwner}
        onPermissionChange={(perm) => setUserPermission(perm)}
        onEndRoom={handleEndRoom}
      />
    </div>
  );
}
