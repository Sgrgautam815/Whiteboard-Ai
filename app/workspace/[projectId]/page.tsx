"use client";

import WorksoaceHeader from "@/components/ui/custom/workspace/WorksoaceHeader";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { OnlineUser } from "@/hooks/useCollaboration";

const Whiteboard = dynamic(
  () => import("@/components/ui/custom/workspace/Whiteboard"),
  { ssr: false }
);

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

function Workspace() {
  const [activeTab, setActiveTab] = useState("whiteBoard");
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [collabStatus, setCollabStatus] = useState<"live" | "reconnecting" | "offline">("live");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userPermission, setUserPermission] = useState<"edit" | "view">("edit");

  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    if (projectId && api) {
      GetWhiteboardData();
    }
  }, [projectId, api]);

  const GetWhiteboardData = async () => {
    try {
      const result = await axios.get("/api/projects?projectId=" + projectId);

      setProjectName(result?.data?.projectName || "Untitled Board");
      if (result?.data?.isOwner === false) {
        // If shared user, check if view permission is set
        const perm = result?.data?.permission === "view" ? "view" : "edit";
        setUserPermission(perm);
      }

      if (result.data?.elements && api) {
        api.updateScene({
          elements: result.data.elements || [],
          appState: normalizeAppState(result.data.appState, api.getAppState()),
        });
      }

      if (result.data?.files && api) {
        api.addFiles(Object.values(result.data.files));
      }
    } catch (error) {
      console.error("Failed to load Whiteboard:", error);
      toast.add({
        title: "Error loading board",
        description: "Could not load board content.",
        type: "error",
      });
    }
  };

  const handleManualSave = async () => {
    if (!api || !projectId || userPermission === "view") return;

    try {
      setSaving(true);
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      let base64Preview = null;
      if (elements.length > 0) {
        try {
          const blob = await exportToBlob({
            elements,
            appState: {
              ...appState,
              exportBackground: true,
              exportWithDarkMode: false,
            },
            files,
            mimeType: "image/webp",
            quality: 0.5,
            getDimensions: () => ({
              width: 400,
              height: 225,
              scale: 1,
            }),
          });

          base64Preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          // fallback preview ignore
        }
      }

      await axios.post("/api/whiteboard", {
        projectId,
        elements,
        appState,
        files,
        base64ImagePreview: base64Preview,
      });

      toast.add({
        title: "Board Saved Successfully",
        description: `"${projectName || "Board"}" is saved to cloud.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to save board:", error);
      toast.add({
        title: "Save failed",
        description: "Unable to save whiteboard state.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportImage = async () => {
    if (!api) return;

    try {
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: {
          ...api.getAppState(),
          exportBackground: true,
        },
        files: api.getFiles(),
        mimeType: "image/png",
        quality: 1,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(projectName || "whiteboard").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.add({
        title: "Export failed",
        description: "Could not export canvas image.",
        type: "error",
      });
    }
  };

  const handleCollabStateChange = useCallback(
    (state: { status: "live" | "reconnecting" | "offline"; onlineUsers: OnlineUser[] }) => {
      setCollabStatus(state.status);
      setOnlineUsers(state.onlineUsers);
    },
    [],
  );

  return (
    <div>
      <div>
        <WorksoaceHeader
          selectedTab={(value: string) => setActiveTab(value)}
          onExport={handleExportImage}
          onSave={handleManualSave}
          projectName={projectName}
          projectId={projectId}
          onProjectRename={(newName) => setProjectName(newName)}
          collabStatus={collabStatus}
          onlineUsers={onlineUsers}
          userPermission={userPermission}
        />

        {activeTab === "whiteBoard" ? (
          <Whiteboard
            onApiReady={(api: ExcalidrawImperativeAPI) => setApi(api)}
            onCollabStateChange={handleCollabStateChange}
            userPermission={userPermission}
          />
        ) : (
          <div className="p-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Smart Document</h2>
            <p className="text-slate-500 text-sm">
              Document notes, requirements, and specifications attached to {projectName || "this workspace"}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workspace;
