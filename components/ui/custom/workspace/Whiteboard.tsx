"use client";

import React, { useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { convertToExcalidrawElements, Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useParams } from "next/navigation";
import { ArrowRight, Circle, Diamond, Eraser, Hand, Image as ImageIcon, Minus, MousePointer2, Pencil, Plus, Sparkles, Square, Type } from "lucide-react";
import AIFloatingSiderbar from "./AIFloatingSiderbar";
import EmojiPicker from "./EmojiPicker";
import FloatingProperties from "./FloatingProerties";
import NotesPicker, { type NoteType } from "./NotesPicker";

type Props = { onApiReady: (api: ExcalidrawImperativeAPI) => void };

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

function Whiteboard({ onApiReady }: Props) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTool, setActiveTool] = useState("selection");
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [canvasState, setCanvasState] = useState<any>(null);
  const [activePopup, setActivePopup] = useState<"notes" | "emoji" | "ai" | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePopup(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const saveCanvasChanges = async (elements: readonly any[], appState: any, files: any) => {
    await fetch("/api/whiteboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ elements, appState, files, projectId }) });
  };

  const handleCanvasChange = (elements: readonly any[], appState: any, files: any) => {
    setCanvasState(appState);
    const selectedIds = Object.keys(appState.selectedElementIds || {});
    setSelectedElement(selectedIds.length === 1 ? elements.find((element) => element.id === selectedIds[0]) : null);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void saveCanvasChanges(elements, appState, files); }, 10000);
  };

  const changeTool = (tool: string) => {
    if (!excalidrawAPI) return;
    setActiveTool(tool);
    excalidrawAPI.setActiveTool({ type: tool as any });
  };

  const getEmptyCanvasPosition = () => {
    if (!excalidrawAPI) return { x: 120, y: 120 };
    const elements = excalidrawAPI.getSceneElements().filter((element) => !element.isDeleted);
    if (!elements.length) return { x: 120, y: 120 };
    return { x: Math.max(...elements.map((element) => element.x + (element.width ?? 0))) + 100, y: Math.min(...elements.map((element) => element.y)) };
  };

  const addCanvasElements = (rawElements: any[]) => {
    if (!excalidrawAPI) return;
    const elements = convertToExcalidrawElements(rawElements);
    excalidrawAPI.updateScene({ elements: [...excalidrawAPI.getSceneElements(), ...elements], appState: { selectedElementIds: { [elements[0].id]: true } } });
    excalidrawAPI.scrollToContent(elements, { fitToContent: true, animate: true });
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
  };

  const handleDuplicate = () => {
    if (!excalidrawAPI || !selectedElement) return;
    const duplicate = { ...selectedElement, id: crypto.randomUUID(), x: selectedElement.x + 20, y: selectedElement.y + 20, version: 1, versionNonce: Math.floor(Math.random() * 2147483647), isDeleted: false };
    excalidrawAPI.updateScene({ elements: [...excalidrawAPI.getSceneElements(), duplicate], appState: { selectedElementIds: { [duplicate.id]: true } } });
  };

  const handleDelete = () => {
    if (!excalidrawAPI || !selectedElement) return;
    excalidrawAPI.updateScene({ elements: excalidrawAPI.getSceneElements().filter((element) => element.id !== selectedElement.id), appState: { selectedElementIds: {} } });
  };

  const reorderSelected = (toFront: boolean) => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();
    const selected = elements.find((element) => element.id === selectedElement.id);
    if (!selected) return;
    const remaining = elements.filter((element) => element.id !== selected.id);
    excalidrawAPI.updateScene({ elements: toFront ? [...remaining, selected] : [selected, ...remaining], appState: { selectedElementIds: { [selected.id]: true } } });
  };

  return (
    <div className="relative" style={{ height: "calc(100vh - 88px)", width: "100%" }}>
      <Excalidraw excalidrawAPI={(api) => { setExcalidrawAPI(api); onApiReady(api); }} onChange={handleCanvasChange} />
      <div className="absolute left-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border bg-white p-1.5 shadow-xl">
        {tools.map((tool) => { const Icon = tool.icon; return <button key={tool.name} type="button" aria-label={tool.name} onClick={() => changeTool(tool.name)} className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-primary/10 ${activeTool === tool.name ? "bg-primary/10" : ""}`}><Icon size={19} className={tool.color} /></button>; })}
      </div>
      <FloatingProperties selectedElement={selectedElement} position={getFloatingPosition()} onPropertyChange={handlePropertyChange} onDuplicate={handleDuplicate} onToggleLock={() => handlePropertyChange("locked", !Boolean(selectedElement?.locked))} onDelete={handleDelete} onBringToFront={() => reorderSelected(true)} onSendToBack={() => reorderSelected(false)} />
      <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
        <button type="button" onClick={() => setActivePopup(activePopup === "notes" ? null : "notes")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-amber-50 ${activePopup === "notes" ? "bg-amber-50 text-amber-700" : "text-slate-700"}`}><Plus size={16} />Notes</button>
        <button type="button" onClick={() => setActivePopup(activePopup === "emoji" ? null : "emoji")} className={`rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-sky-50 ${activePopup === "emoji" ? "bg-sky-50 text-sky-700" : "text-slate-700"}`}>😊 Emoji</button>
        <button type="button" onClick={() => setActivePopup(activePopup === "ai" ? null : "ai")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-violet-50 ${activePopup === "ai" ? "bg-violet-50 text-violet-700" : "text-slate-700"}`}><Sparkles size={16} />AI Helper</button>
      </div>
      {activePopup === "notes" && <NotesPicker onSelect={addNote} onClose={() => setActivePopup(null)} />}
      {activePopup === "emoji" && <EmojiPicker onSelectEmoji={addEmoji} onClose={() => setActivePopup(null)} />}
      {activePopup === "ai" && <AIFloatingSiderbar excalidrawApi={excalidrawAPI} onClose={() => setActivePopup(null)} />}
    </div>
  );
}

export default Whiteboard;
