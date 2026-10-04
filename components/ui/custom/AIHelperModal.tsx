"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  Workflow,
  Network,
  Database,
  GitCommit,
  Boxes,
  Activity,
  Layers,
  Cpu,
  BrainCircuit,
  ArrowRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

async function convertDiagramToExcalidraw(rawElements: any[]) {
  const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
  return convertToExcalidrawElements(rawElements);
}

export type DiagramTypeOption = {
  name: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
  prompt: string;
};

export const DIAGRAM_TYPES: DiagramTypeOption[] = [
  {
    name: "Flowchart",
    desc: "Visual decision flow and process steps",
    icon: Workflow,
    color: "text-violet-600",
    bg: "bg-violet-50",
    prompt: "You are an expert flowchart generation agent. Use rectangles for processes, diamonds for decisions, ellipses for start/end, and arrows for flow.",
  },
  {
    name: "System Architecture",
    desc: "Full-stack systems, APIs, cloud, databases",
    icon: Network,
    color: "text-orange-600",
    bg: "bg-orange-50",
    prompt: "You are an expert software architecture generation agent. Include frontend, API gateway, microservices, databases, auth, and external services.",
  },
  {
    name: "ER Diagram",
    desc: "Database entities, tables, and relationships",
    icon: Database,
    color: "text-blue-600",
    bg: "bg-blue-50",
    prompt: "You are an expert ER diagram generation agent. Include database entities, primary/foreign keys, attributes, and relationships.",
  },
  {
    name: "Sequence Diagram",
    desc: "Actor interactions and message timelines",
    icon: GitCommit,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    prompt: "You are an expert sequence diagram generation agent. Model actors, systems, lifelines, and sequential message calls.",
  },
  {
    name: "Class Diagram",
    desc: "OOP structure, entities, inheritance, methods",
    icon: Boxes,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    prompt: "You are an expert UML class diagram generation agent. Model class structures, fields, methods, and relationships.",
  },
  {
    name: "Network Diagram",
    desc: "Routers, firewalls, servers, subnet topology",
    icon: Cpu,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    prompt: "You are an expert network diagram generation agent. Model subnets, routers, firewalls, load balancers, and servers.",
  },
  {
    name: "Workflow",
    desc: "Business logic and step-by-step procedure",
    icon: Activity,
    color: "text-pink-600",
    bg: "bg-pink-50",
    prompt: "You are an expert business workflow generation agent. Model input triggers, processing steps, approvals, and outputs.",
  },
  {
    name: "Process Diagram",
    desc: "Operational pipelines and state transitions",
    icon: Layers,
    color: "text-teal-600",
    bg: "bg-teal-50",
    prompt: "You are an expert process flow generation agent. Model operational stages, inputs, validation checkpoints, and outcomes.",
  },
  {
    name: "Mind Map",
    desc: "Central topic branching into sub-concepts",
    icon: BrainCircuit,
    color: "text-purple-600",
    bg: "bg-purple-50",
    prompt: "You are an expert mind map generation agent. Model a central root concept branching out into key sub-topics and details.",
  },
];

interface AIHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  excalidrawApi?: ExcalidrawImperativeAPI | null;
  onDiagramGeneratedInWorkspace?: (elements: any[]) => void;
}

export function AIHelperModal({
  isOpen,
  onClose,
  excalidrawApi,
  onDiagramGeneratedInWorkspace,
}: AIHelperModalProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Flowchart");
  const [loading, setLoading] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState<any | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    const cleanedPrompt = prompt.trim();
    if (!cleanedPrompt) {
      toast.add({
        title: "Prompt required",
        description: "Please enter what you want to visualize.",
        type: "warning",
      });
      return;
    }

    const typeConfig = DIAGRAM_TYPES.find((t) => t.name === selectedType) || DIAGRAM_TYPES[0];

    setLoading(true);
    setGeneratedDiagram(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: cleanedPrompt,
          type: typeConfig.name,
          systemPrompt: typeConfig.prompt,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "AI generation failed");
      }

      const result = await response.json();
      const diagram = result?.diagramResult;

      if (!diagram?.elements?.length) {
        throw new Error("Unable to generate diagram elements. Please try again.");
      }

      setGeneratedDiagram(diagram);

      toast.add({
        title: "Diagram Generated!",
        description: `Successfully created "${diagram.title || selectedType}".`,
        type: "success",
      });

      // If user is inside workspace editor, insert directly
      if (excalidrawApi) {
        const rawElements = convertAIDiagramToRaw(diagram);
        const convertedElements = await convertDiagramToExcalidraw(rawElements);
        const existing = excalidrawApi.getSceneElements();
        excalidrawApi.updateScene({ elements: [...existing, ...convertedElements] });
        excalidrawApi.scrollToContent(convertedElements, { fitToContent: true, animate: true });
        onDiagramGeneratedInWorkspace?.(convertedElements);
      }
    } catch (error) {
      console.error("AI Helper Error:", error);
      toast.add({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unable to generate the diagram. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInEditor = async () => {
    if (!generatedDiagram) return;

    try {
      setLoading(true);
      const projectId = crypto.randomUUID();
      const title = generatedDiagram.title || prompt.trim() || `${selectedType} Diagram`;

      // 1. Create Project in DB
      const projRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, projectName: title }),
      });

      if (!projRes.ok) {
        throw new Error("Failed to create new board for AI diagram.");
      }

      // 2. Convert to Excalidraw elements
      const rawElements = convertAIDiagramToRaw(generatedDiagram);
      const convertedElements = await convertDiagramToExcalidraw(rawElements);

      // 3. Save elements to Whiteboard DB
      await fetch("/api/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          elements: convertedElements,
          appState: {},
          files: {},
        }),
      });

      onClose();
      router.push(`/workspace/${projectId}`);
    } catch (err) {
      console.error("Failed to open diagram in editor:", err);
      toast.add({
        title: "Error creating workspace",
        description: err instanceof Error ? err.message : "Failed to open diagram.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border border-slate-200 bg-white rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-slate-100 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Sparkles size={22} className="text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">AI Helper</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-0.5">
                Describe what you want to visualize.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Quick options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick options / Diagram type:
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {DIAGRAM_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.name;

                return (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => setSelectedType(type.name)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-1 ring-blue-600/30"
                        : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${type.bg} ${type.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="truncate text-xs font-semibold">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Prompt Input */}
          <div className="space-y-2">
            <label htmlFor="ai-modal-prompt" className="text-sm font-semibold text-slate-800 flex justify-between">
              <span>Your Idea / Concept</span>
              <span className="text-xs font-normal text-slate-400">Selected: {selectedType}</span>
            </label>
            <textarea
              id="ai-modal-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create an online complaint management system for a college with student, admin, and resolution workflow."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Result Action state */}
          {generatedDiagram && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-emerald-900 text-sm">
                    ✨ Diagram Created: {generatedDiagram.title}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {generatedDiagram.elements.length} nodes & {generatedDiagram.connections.length} connections ready.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <RotateCcw size={13} /> Generate Again
                  </button>
                  {!excalidrawApi && (
                    <button
                      type="button"
                      onClick={handleOpenInEditor}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Open in Editor <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Generate button */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating your diagram...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Diagram</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function convertAIDiagramToRaw(diagram: any) {
  const elements = Array.isArray(diagram?.elements) ? diagram.elements : [];
  const connections = Array.isArray(diagram?.connections) ? diagram.connections : [];
  const rawElements: any[] = [];
  const origin = { x: 100, y: 100 };

  if (diagram?.title) {
    rawElements.push({
      type: "text",
      id: `ai-title-${crypto.randomUUID()}`,
      x: origin.x,
      y: origin.y - 50,
      text: diagram.title,
      fontSize: 24,
      strokeColor: "#0f172a",
    });
  }

  const nodeMap = new Map();

  for (const node of elements) {
    const id = `ai-${node.id}-${crypto.randomUUID()}`;
    nodeMap.set(node.id, node);
    const x = origin.x + Number(node.x || 0);
    const y = origin.y + Number(node.y || 0);
    const width = Math.max(180, Number(node.width || 240));
    const height = Math.max(80, Number(node.height || 96));
    const type = ["rectangle", "diamond", "ellipse"].includes(node.type) ? node.type : "rectangle";

    rawElements.push({
      type,
      id,
      x,
      y,
      width,
      height,
      strokeColor: node.strokeColor || "#1f2937",
      backgroundColor: node.backgroundColor || "#ffffff",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 1,
    });

    if (node.label) {
      rawElements.push({
        type: "text",
        id: `ai-label-${node.id}-${crypto.randomUUID()}`,
        x: x + 15,
        y: y + height / 2 - 10,
        text: node.label,
        fontSize: 15,
        strokeColor: node.strokeColor || "#0f172a",
      });
    }
  }

  for (const conn of connections) {
    const fromNode = nodeMap.get(conn.from);
    const toNode = nodeMap.get(conn.to);
    if (!fromNode || !toNode) continue;

    const startX = origin.x + (fromNode.x || 0) + (fromNode.width || 240) / 2;
    const startY = origin.y + (fromNode.y || 0) + (fromNode.height || 96) / 2;
    const endX = origin.x + (toNode.x || 0) + (toNode.width || 240) / 2;
    const endY = origin.y + (toNode.y || 0) + (toNode.height || 96) / 2;

    rawElements.push({
      type: "arrow",
      id: `ai-arrow-${conn.id || crypto.randomUUID()}`,
      x: startX,
      y: startY,
      points: [
        [0, 0],
        [endX - startX, endY - startY],
      ],
      strokeColor: "#475569",
      strokeWidth: 2,
      endArrowhead: "arrow",
    });

    if (conn.label) {
      rawElements.push({
        type: "text",
        id: `ai-conn-label-${crypto.randomUUID()}`,
        x: (startX + endX) / 2,
        y: (startY + endY) / 2 - 15,
        text: conn.label,
        fontSize: 13,
        strokeColor: "#64748b",
      });
    }
  }

  return rawElements;
}
