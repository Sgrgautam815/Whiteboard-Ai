"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "@excalidraw/excalidraw/index.css";
import { convertToExcalidrawElements, Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Circle,
  Diamond,
  Eraser,
  Hand,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Type,
} from "lucide-react";
import AIFloatingSiderbar from "./AIFloatingSiderbar";
import EmojiPicker from "./EmojiPicker";
import FloatingProperties from "./FloatingProerties";
import NotesPicker, { type NoteType } from "./NotesPicker";
import PencilBoxPopup from "./PencilBoxPopup";
import { useCollaboration, OnlineUser } from "@/hooks/useCollaboration";
import { CollaboratorCursors } from "./CollaboratorCursors";
import { toast } from "@/components/ui/toast";

type Props = {
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
  onCollabStateChange?: (state: {
    status: "live" | "reconnecting" | "offline";
    onlineUsers: OnlineUser[];
  }) => void;
  userPermission?: "edit" | "view";
};

const tools = [
  { name: "selection", icon: MousePointer2, color: "text-blue-600" },
  { name: "hand", icon: Hand, color: "text-cyan-600" },
  { name: "rectangle", icon: Square, color: "text-blue-600" },
  { name: "diamond", icon: Diamond, color: "text-emerald-500" },
  { name: "ellipse", icon: Circle, color: "text-amber-600" },
  { name: "arrow", icon: ArrowRight, color: "text-blue-600" },
  { name: "line", icon: Minus, color: "text-blue-600" },
  { name: "freedraw", icon: Pencil, color: "text-blue-600" },
  { name: "eraser", icon: Eraser, color: "text-rose-600" },
  { name: "text", icon: Type, color: "text-blue-600" },
  { name: "image", icon: ImageIcon, color: "text-blue-600" },
];

function mergeExcalidrawElements(localElements: readonly any[], remoteElements: any[]) {
  const map = new Map<string, any>();
  for (const el of localElements) {
    if (el?.id) map.set(el.id, el);
  }
  for (const el of remoteElements) {
    if (!el?.id) continue;
    const existing = map.get(el.id);
    if (!existing) {
      map.set(el.id, el);
    } else {
      const existingVer = existing.version ?? 0;
      const remoteVer = el.version ?? 0;
      if (remoteVer >= existingVer) {
        map.set(el.id, el);
      }
    }
  }
  return Array.from(map.values());
}

function Whiteboard({ onApiReady, onCollabStateChange, userPermission = "edit" }: Props) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const { projectId } = useParams<{ projectId: string }>();

  const [activeTool, setActiveTool] = useState("selection");
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [canvasState, setCanvasState] = useState<any>(null);
  const [activePopup, setActivePopup] = useState<"notes" | "emoji" | "ai" | "pencil" | null>(null);

  const [pencilSettings, setPencilSettings] = useState({
    strokeWidth: 2,
    strokeColor: "#1e293b",
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
  });

  // Real-Time Collaboration Socket Handler
  const handleRemoteElementsChange = useCallback(
    (remoteElements: any[], senderName?: string, isAiGenerated?: boolean) => {
      if (!excalidrawAPI) return;
      isRemoteUpdateRef.current = true;

      const currentElements = excalidrawAPI.getSceneElements();
      const merged = mergeExcalidrawElements(currentElements, remoteElements);

      excalidrawAPI.updateScene({ elements: merged });

      if (isAiGenerated && senderName) {
        toast.add({
          title: "AI Diagram Added Live",
          description: `${senderName} added an AI-generated diagram to this board.`,
          type: "success",
        });
      }

      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 100);
    },
    [excalidrawAPI],
  );

  const {
    status: collabStatus,
    onlineUsers,
    cursors,
    broadcastElementsChange,
    broadcastCursor,
    broadcastSelection,
  } = useCollaboration(projectId, userPermission, handleRemoteElementsChange);

  useEffect(() => {
    onCollabStateChange?.({ status: collabStatus, onlineUsers });
  }, [collabStatus, onlineUsers, onCollabStateChange]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePopup(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const saveCanvasChanges = async (elements: readonly any[], appState: any, files: any) => {
    if (userPermission === "view") return;
    const base64ImagePreview = await generatePreviewBase64();

    await fetch("/api/whiteboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        elements,
        appState,
        files,
        projectId,
        base64ImagePreview,
      }),
    });
  };

  const generatePreviewBase64 = async () => {
    if (!excalidrawAPI) return null;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements.length) return null;

    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();

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

    return await blobToBase64(blob);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleCanvasChange = (elements: readonly any[], appState: any, files: any) => {
    setCanvasState(appState);
    const selectedIds = Object.keys(appState.selectedElementIds || {});
    const targetElement = selectedIds.length === 1 ? elements.find((element) => element.id === selectedIds[0]) : null;
    setSelectedElement(targetElement);

    // Broadcast selection changes to collaborators
    broadcastSelection(selectedIds);

    if (targetElement && targetElement.type === "freedraw") {
      setPencilSettings((prev) => ({
        ...prev,
        strokeWidth: targetElement.strokeWidth ?? prev.strokeWidth,
        strokeColor: targetElement.strokeColor ?? prev.strokeColor,
        strokeStyle: targetElement.strokeStyle ?? prev.strokeStyle,
        roughness: targetElement.roughness ?? prev.roughness,
        opacity: targetElement.opacity ?? prev.opacity,
      }));
    }

    // Broadcast real-time elements update if change originated locally
    if (!isRemoteUpdateRef.current && userPermission === "edit") {
      broadcastElementsChange(elements);
    }

    // Auto-save to Postgres database with debouncing
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveCanvasChanges(elements, appState, files);
    }, 8000);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasState || !excalidrawAPI) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const zoom = canvasState.zoom?.value || 1;
    const scrollX = canvasState.scrollX?.value || 0;
    const scrollY = canvasState.scrollY?.value || 0;

    const canvasX = (e.clientX - rect.left) / zoom - scrollX;
    const canvasY = (e.clientY - rect.top) / zoom - scrollY;

    broadcastCursor(canvasX, canvasY);
  };

  const handlePencilPropertyChange = (property: string, value: unknown) => {
    setPencilSettings((prev) => ({ ...prev, [property]: value }));
    if (!excalidrawAPI) return;

    const appStateKeyMap: Record<string, string> = {
      strokeWidth: "currentItemStrokeWidth",
      strokeColor: "currentItemStrokeColor",
      strokeStyle: "currentItemStrokeStyle",
      roughness: "currentItemRoughness",
      opacity: "currentItemOpacity",
    };

    const appStateKey = appStateKeyMap[property];
    if (appStateKey) {
      excalidrawAPI.updateScene({
        appState: {
          [appStateKey]: value,
        } as any,
      });
    }

    if (selectedElement && selectedElement.type === "freedraw") {
      handlePropertyChange(property, value);
    }
  };

  const changeTool = (tool: string) => {
    if (!excalidrawAPI) return;
    if (tool === "freedraw") {
      if (activeTool === "freedraw") {
        setActivePopup((prev) => (prev === "pencil" ? null : "pencil"));
      } else {
        setActiveTool("freedraw");
        excalidrawAPI.setActiveTool({ type: "freedraw" });
        setActivePopup("pencil");
      }
    } else {
      setActiveTool(tool);
      excalidrawAPI.setActiveTool({ type: tool as any });
      if (activePopup === "pencil") {
        setActivePopup(null);
      }
    }
  };

  const getEmptyCanvasPosition = () => {
    if (!excalidrawAPI) return { x: 120, y: 120 };
    const elements = excalidrawAPI.getSceneElements().filter((element) => !element.isDeleted);
    if (!elements.length) return { x: 120, y: 120 };
    return {
      x: Math.max(...elements.map((element) => element.x + (element.width ?? 0))) + 100,
      y: Math.min(...elements.map((element) => element.y)),
    };
  };

  const addCanvasElements = (rawElements: any[]) => {
    if (!excalidrawAPI) return;
    const elements = convertToExcalidrawElements(rawElements);
    const updated = [...excalidrawAPI.getSceneElements(), ...elements];
    excalidrawAPI.updateScene({
      elements: updated,
      appState: { selectedElementIds: { [elements[0].id]: true } },
    });
    excalidrawAPI.scrollToContent(elements, { fitToContent: true, animate: true });
    broadcastElementsChange(updated);
  };

  const addNote = (noteType: NoteType) => {
    const position = getEmptyCanvasPosition();
    const styles = {
      sticky: { bg: "#fef3c7", stroke: "#d97706", title: "Sticky Note", body: "Write an idea...", badge: "New" },
      glass: { bg: "#e0f2fe", stroke: "#0284c7", title: "Glass Note", body: "Add a meeting note...", badge: "New" },
      task: { bg: "#dcfce7", stroke: "#16a34a", title: "Task Card", body: "Add a task...", badge: "TODO" },
    }[noteType];
    const id = crypto.randomUUID();
    addCanvasElements([
      { type: "rectangle", id: `note-${id}`, x: position.x, y: position.y, width: 300, height: 190, backgroundColor: styles.bg, strokeColor: styles.stroke, fillStyle: "solid", strokeWidth: 2, roughness: 1, roundness: { type: 3 } },
      { type: "text", id: `note-badge-${id}`, x: position.x + 20, y: position.y + 18, text: styles.badge, fontSize: 14, strokeColor: styles.stroke },
      { type: "text", id: `note-title-${id}`, x: position.x + 24, y: position.y + 55, text: styles.title, fontSize: 22, strokeColor: "#0f172a" },
      { type: "text", id: `note-body-${id}`, x: position.x + 24, y: position.y + 105, text: styles.body, fontSize: 16, strokeColor: "#334155" },
    ]);
    setActivePopup(null);
  };

  const addEmoji = (emoji: string) => {
    const position = getEmptyCanvasPosition();
    addCanvasElements([{ type: "text", id: `emoji-${crypto.randomUUID()}`, x: position.x, y: position.y, text: emoji, fontSize: 48, strokeColor: "#0f172a" }]);
    setActivePopup(null);
  };

  const getFloatingPosition = () => {
    if (!selectedElement || !canvasState) return { left: 0, top: 0 };
    const zoom = canvasState.zoom?.value ?? 1;
    return { left: (selectedElement.x + (canvasState.scrollX?.value ?? 0)) * zoom, top: (selectedElement.y + (canvasState.scrollY?.value ?? 0)) * zoom - 60 };
  };

  const handlePropertyChange = (property: string, value: unknown) => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements().map((element) => element.id === selectedElement.id ? { ...element, [property]: value, version: element.version + 1, updated: Date.now(), versionNonce: Math.floor(Math.random() * 2147483647) } : element);
    excalidrawAPI.updateScene({ elements, appState: { selectedElementIds: { [selectedElement.id]: true } } });
    broadcastElementsChange(elements);
  };

  const handleDuplicate = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const duplicate = { ...selectedElement, id: crypto.randomUUID(), x: selectedElement.x + 20, y: selectedElement.y + 20, version: 1, versionNonce: Math.floor(Math.random() * 2147483647), isDeleted: false };
    const updated = [...excalidrawAPI.getSceneElements(), duplicate];
    excalidrawAPI.updateScene({ elements: updated, appState: { selectedElementIds: { [duplicate.id]: true } } });
    broadcastElementsChange(updated);
  };

  const handleDelete = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const updated = excalidrawAPI.getSceneElements().filter((element) => element.id !== selectedElement.id);
    excalidrawAPI.updateScene({ elements: updated, appState: { selectedElementIds: {} } });
    broadcastElementsChange(updated);
  };

  const reorderSelected = (toFront: boolean) => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const selected = elements.find((element) => element.id === selectedElement.id);
    if (!selected) return;
    const remaining = elements.filter((element) => element.id !== selected.id);
    const updated = toFront ? [...remaining, selected] : [selected, ...remaining];
    excalidrawAPI.updateScene({ elements: updated, appState: { selectedElementIds: { [selected.id]: true } } });
    broadcastElementsChange(updated);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "calc(100vh - 88px)", width: "100%" }}
      onPointerMove={handlePointerMove}
    >
      <Excalidraw
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api);
          onApiReady(api);
        }}
        onChange={handleCanvasChange}
        viewModeEnabled={userPermission === "view"}
      />

      {/* Real-Time Collaborator Live Cursors Overlay */}
      <CollaboratorCursors
        cursors={cursors}
        scrollX={canvasState?.scrollX?.value}
        scrollY={canvasState?.scrollY?.value}
        zoom={canvasState?.zoom?.value}
      />

      {/* Left Tool Picker */}
      {userPermission === "edit" && (
        <div className="absolute left-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border bg-white p-1.5 shadow-xl">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isPencil = tool.name === "freedraw";
            return (
              <button
                key={tool.name}
                type="button"
                aria-label={tool.name}
                onClick={() => changeTool(tool.name)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-primary/10 ${
                  activeTool === tool.name ? "bg-primary/10 ring-2 ring-blue-500/20" : ""
                }`}
              >
                <Icon size={19} className={tool.color} />
                {isPencil && (
                  <span
                    className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: pencilSettings.strokeColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Property Bar */}
      {userPermission === "edit" && (
        <FloatingProperties
          selectedElement={selectedElement}
          position={getFloatingPosition()}
          onPropertyChange={handlePropertyChange}
          onDuplicate={handleDuplicate}
          onToggleLock={() => handlePropertyChange("locked", !Boolean(selectedElement?.locked))}
          onDelete={handleDelete}
          onBringToFront={() => reorderSelected(true)}
          onSendToBack={() => reorderSelected(false)}
        />
      )}

      {/* Bottom Action bar */}
      <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
        {userPermission === "edit" && (
          <>
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === "notes" ? null : "notes")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-amber-50 ${
                activePopup === "notes" ? "bg-amber-50 text-amber-700" : "text-slate-700"
              }`}
            >
              <Plus size={16} />
              Notes
            </button>
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === "emoji" ? null : "emoji")}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-sky-50 ${
                activePopup === "emoji" ? "bg-sky-50 text-sky-700" : "text-slate-700"
              }`}
            >
              😊 Emoji
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setActivePopup(activePopup === "ai" ? null : "ai")}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-violet-50 ${
            activePopup === "ai" ? "bg-violet-50 text-violet-700" : "text-slate-700"
          }`}
        >
          <Sparkles size={16} />
          AI Helper
        </button>
      </div>

      {activePopup === "pencil" && (
        <PencilBoxPopup
          currentStrokeWidth={pencilSettings.strokeWidth}
          currentStrokeColor={pencilSettings.strokeColor}
          currentStrokeStyle={pencilSettings.strokeStyle}
          currentRoughness={pencilSettings.roughness}
          currentOpacity={pencilSettings.opacity}
          onChange={handlePencilPropertyChange}
          onClose={() => setActivePopup(null)}
        />
      )}
      {activePopup === "notes" && <NotesPicker onSelect={addNote} onClose={() => setActivePopup(null)} />}
      {activePopup === "emoji" && <EmojiPicker onSelectEmoji={addEmoji} onClose={() => setActivePopup(null)} />}
      {activePopup === "ai" && (
        <AIFloatingSiderbar
          excalidrawApi={excalidrawAPI}
          onClose={() => setActivePopup(null)}
          onAiDiagramGenerated={(elements) => broadcastElementsChange(elements, true)}
        />
      )}
    </div>
  );
}

export default Whiteboard;
