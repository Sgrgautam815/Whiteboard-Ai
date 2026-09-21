"use client";

import React, { useState } from "react";
import {
  Monitor,
  Network,
  PencilRuler,
  Smartphone,
  Sparkles,
  Workflow,
  X,
  ArrowUp,
  Loader2Icon,
} from "lucide-react";

import { Textarea } from "../../textarea";
import { toast } from "../../toast";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

type Props = {
  excalidrawApi: ExcalidrawImperativeAPI | null;
  onClose?: () => void;
};

const AiTools = [
  {
    name: "Generate Diagrams",
    desc: "Create diagrams from simple ideas",
    icon: PencilRuler,
    color: "text-blue-600",
    bg: "bg-blue-50",
    prompt: `You are an expert visual diagram generation agent. Turn the user's idea into a polished general diagram with clear sections, relationships, readable labels, and useful connections. Output only the requested logical diagram JSON.`,
  },
  {
    name: "Flowchart",
    desc: "Turn ideas into visual workflows",
    icon: Workflow,
    color: "text-violet-600",
    bg: "bg-violet-50",
    prompt: `You are an expert flowchart generation agent. Use rectangles for processes, diamonds for decisions, ellipses for start and end, and arrows for flow. Prefer a clear top-to-bottom layout. Output only the requested logical diagram JSON.`,
  },
  {
    name: "Architecture",
    desc: "Create system architecture diagrams",
    icon: Network,
    color: "text-orange-600",
    bg: "bg-orange-50",
    prompt: `You are an expert software architecture diagram generation agent. Include relevant users, frontend, backend, APIs, database, authentication, external services, and infrastructure. Prefer a clear left-to-right layout. Output only the requested logical diagram JSON.`,
  },
  {
    name: "Web Mockup",
    desc: "Generate website wireframes",
    icon: Monitor,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    prompt: `You are an expert website wireframe generation agent. Create logical wireframe elements such as navigation, headers, content sections, cards, forms, and actions with clear relationships. Output only the requested logical diagram JSON.`,
  },
  {
    name: "Mobile Mockup",
    desc: "Create mobile app wireframes",
    icon: Smartphone,
    color: "text-pink-600",
    bg: "bg-pink-50",
    prompt: `You are an expert mobile application wireframe generation agent. Create logical screens and UI elements such as navigation, inputs, cards, lists, and buttons with clear relationships. Output only the requested logical diagram JSON.`,
  },
];

const AI_PLACEHOLDER_IDS = {
  container: "ai-Placeholder-container",
  title: "ai-Placeholder-title",
  subtitle: "ai-Placeholder-subtitle",
  skeleton1: "ai-Placeholder-Skeleton-1",
  skeleton2: "ai-Placeholder-Skeleton-2",
  skeleton3: "ai-Placeholder-Skeleton-3",
};

type AIDiagramNode = {
  id: string;
  type: "rectangle" | "diamond" | "ellipse";
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
};

type AIDiagramConnection = {
  id?: string;
  from: string;
  to: string;
  label?: string;
};

type AIDiagram = {
  title?: string;
  elements?: AIDiagramNode[];
  connections?: AIDiagramConnection[];
};

const estimateTextWidth = (text: string, fontSize: number) => text.length * fontSize * 0.55;

const wrapText = (text: string, maxChars = 18) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3).join("\n");
};

function AIFloatingSiderbar({ excalidrawApi, onClose }: Props) {
  const [selectedTool, setSelectedTool] = useState("Generate Diagrams");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const getEmptyCanvasPosition = () => {
    if (!excalidrawApi) {
      return { x: 100, y: 100 };
    }

    const elements = excalidrawApi
      .getSceneElements()
      .filter(
        (element) =>
          !element.isDeleted && !Object.values(AI_PLACEHOLDER_IDS).includes(element.id),
      );

    if (elements.length === 0) {
      return { x: 100, y: 100 };
    }

    const maxRight = Math.max(...elements.map((element) => element.x + (element.width ?? 0)));
    const minTop = Math.min(...elements.map((element) => element.y));

    return {
      x: maxRight + 150,
      y: minTop,
    };
  };

  const getConnectionPoints = (
    fromNode: AIDiagramNode,
    toNode: AIDiagramNode,
    origin: { x: number; y: number },
  ) => {
    const fromX = origin.x + Number(fromNode.x || 0);
    const fromY = origin.y + Number(fromNode.y || 0);
    const fromWidth = Number(fromNode.width || 200);
    const fromHeight = Number(fromNode.height || 80);
    const toX = origin.x + Number(toNode.x || 0);
    const toY = origin.y + Number(toNode.y || 0);
    const toWidth = Number(toNode.width || 200);
    const toHeight = Number(toNode.height || 80);
    const fromCenterX = fromX + fromWidth / 2;
    const fromCenterY = fromY + fromHeight / 2;
    const toCenterX = toX + toWidth / 2;
    const toCenterY = toY + toHeight / 2;
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    if (Math.abs(dy) >= Math.abs(dx)) {
      if (dy > 0) {
        return {
          startX: fromCenterX,
          startY: fromY + fromHeight,
          endX: toCenterX,
          endY: toY,
        };
      }

      return {
        startX: fromCenterX,
        startY: fromY,
        endX: toCenterX,
        endY: toY + toHeight,
      };
    }

    if (dx > 0) {
      return {
        startX: fromX + fromWidth,
        startY: fromCenterY,
        endX: toX,
        endY: toCenterY,
      };
    }

    return {
      startX: fromX,
      startY: fromCenterY,
      endX: toX + toWidth,
      endY: toCenterY,
    };
  };

  const renderAIDiagram = (diagram: AIDiagram) => {
    if (!excalidrawApi) return;

    const aiElements = Array.isArray(diagram?.elements) ? diagram.elements : [];
    const connections = Array.isArray(diagram?.connections) ? diagram.connections : [];
    if (!aiElements.length) return;

    const existingElements = excalidrawApi
      .getSceneElements()
      .filter((element) => !Object.values(AI_PLACEHOLDER_IDS).includes(element.id));
    const origin = getEmptyCanvasPosition();
    const getNode = (id: string) => aiElements.find((element) => element.id === id);
    const generatedElements: any[] = [];

    if (diagram.title) {
      generatedElements.push({
        type: "text",
        id: `ai-title-${crypto.randomUUID()}`,
        x: origin.x,
        y: origin.y - 58,
        text: diagram.title,
        fontSize: 28,
        strokeColor: "#0f172a",
      });
    }

    for (const node of aiElements) {
      const label = node.label ? wrapText(node.label) : "";
      const labelLines = label ? label.split("\n") : [];
      const width = Math.max(180, Number(node.width || 240));
      const height = Math.max(80, Number(node.height || 96), labelLines.length * 22 + 34);
      const x = origin.x + Number(node.x || 0);
      const y = origin.y + Number(node.y || 0);
      const type = ["rectangle", "diamond", "ellipse"].includes(node.type)
        ? node.type
        : "rectangle";
      const strokeColor = node.strokeColor || "#1f2937";
      const backgroundColor = node.backgroundColor || "#ffffff";

      generatedElements.push({
        type,
        id: `ai-${node.id}-${crypto.randomUUID()}`,
        x,
        y,
        width,
        height,
        strokeColor,
        backgroundColor,
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 1,
      });

      if (node.label) {
        const fontSize = 16;
        const longestLine = labelLines.reduce((longest, line) => (
          line.length > longest.length ? line : longest
        ), "");
        const textWidth = Math.min(width - 24, estimateTextWidth(longestLine, fontSize));
        const textHeight = labelLines.length * 20;

        generatedElements.push({
          type: "text",
          id: `ai-label-${node.id}-${crypto.randomUUID()}`,
          x: x + (width - textWidth) / 2,
          y: y + (height - textHeight) / 2,
          text: label,
          fontSize,
          strokeColor,
          textAlign: "center",
        });
      }
    }

    for (const connection of connections) {
      const fromNode = getNode(connection.from);
      const toNode = getNode(connection.to);
      if (!fromNode || !toNode) continue;

      const points = getConnectionPoints(fromNode, toNode, origin);
      generatedElements.push({
        type: "arrow",
        id: `ai-arrow-${connection.id || crypto.randomUUID()}`,
        x: points.startX,
        y: points.startY,
        points: [
          [0, 0],
          [points.endX - points.startX, points.endY - points.startY],
        ],
        strokeColor: "#64748b",
        strokeWidth: 2,
        fillStyle: "solid",
        roughness: 1,
        startArrowhead: null,
        endArrowhead: "arrow",
      });

      if (connection.label) {
        const label = wrapText(connection.label, 16);
        const labelWidth = Math.min(160, estimateTextWidth(label.split("\n")[0] || label, 14));

        generatedElements.push({
          type: "text",
          id: `ai-connection-label-${crypto.randomUUID()}`,
          x: (points.startX + points.endX) / 2 - labelWidth / 2,
          y: (points.startY + points.endY) / 2 - 18,
          text: label,
          fontSize: 14,
          strokeColor: "#475569",
          textAlign: "center",
        });
      }
    }

    const convertedElements = convertToExcalidrawElements(generatedElements);
    const allElements = [...existingElements, ...convertedElements];

    excalidrawApi.updateScene({ elements: allElements });
    excalidrawApi.scrollToContent(convertedElements, { fitToContent: true, animate: true });
  };

  const addAiPlaceholder = () => {
    if (!excalidrawApi) return;

    const position = getEmptyCanvasPosition();
    const titleText = prompt.trim() || `${selectedTool} idea`;
    const subtitleText = `AI draft for: ${titleText}`;

    const placeholderElements = convertToExcalidrawElements([
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.container,
        x: position.x,
        y: position.y,
        width: 420,
        height: 250,
        backgroundColor: "#f5f3ff",
        strokeColor: "#8b5cf6",
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 1,
        roundness: {
          type: 3,
        },
      },
      {
        type: "text",
        id: AI_PLACEHOLDER_IDS.title,
        x: position.x + 28,
        y: position.y + 28,
        text: `Generating ${selectedTool}`,
        fontSize: 22,
        strokeColor: "#6d28d9",
      },
      {
        type: "text",
        id: AI_PLACEHOLDER_IDS.subtitle,
        x: position.x + 28,
        y: position.y + 60,
        text: subtitleText,
        fontSize: 15,
        strokeColor: "#6d7280",
      },
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.skeleton1,
        x: position.x + 28,
        y: position.y + 185,
        width: 190,
        height: 18,
        backgroundColor: "#ddd6fe",
        strokeColor: "#6d28d9",
        fillStyle: "solid",
        roughness: 1,
        roundness: {
          type: 3,
        },
      },
       {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.skeleton2,
        x: position.x + 28,
        y: position.y + 150,
        width: 330,
        height: 18,
        backgroundColor: "#ddd6fe",
        strokeColor: "#6d28d9",
        fillStyle: "solid",
        roughness: 1,
        roundness: {
          type: 3,
        },
      },
      {
        type: "rectangle",
        id: AI_PLACEHOLDER_IDS.skeleton3,
        x: position.x + 28,
        y: position.y + 215,
        width: 260,
        height: 18,
        backgroundColor: "#ddd6fe",
        strokeColor: "#6d28d9",
        fillStyle: "solid",
        roughness: 1,
        roundness: {
          type: 3,
        },
      },
    ]);

    const currentElements = excalidrawApi.getSceneElements();

    excalidrawApi.updateScene({
      elements: [...currentElements, ...placeholderElements],
      appState: {
        selectedElementIds: { [AI_PLACEHOLDER_IDS.container]: true },
      },
    });
  };

  const onClickGenerate = async () => {
    const cleanedPrompt = prompt.trim();

    if (!cleanedPrompt) {
      toast.add({
        title: "Add a prompt",
        description: "Describe the diagram you want to generate.",
        type: "warning",
      });
      return;
    }

    const currentAiTool = AiTools.find((tool) => tool.name === selectedTool);

    if (!currentAiTool) {
      return;
    }

    addAiPlaceholder();
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: cleanedPrompt,
          type: currentAiTool.name,
          systemPrompt: currentAiTool.prompt,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage =
          typeof errorBody?.error === "string" ? errorBody.error : "AI generation failed";
        throw new Error(errorMessage);
      }

      
      const result = await response.json();
      if (!result?.diagramResult?.elements?.length) {
        throw new Error("AI returned no diagram elements");
      }

      renderAIDiagram(result.diagramResult);

      onClose?.();
    } catch (error) {
      removeAiPlaceholder();
      console.error(error);
      toast.add({
        title: "Unable to generate diagram",
        description: error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAiPlaceholder = () => {
    if (!excalidrawApi) return;

    const placeholderIds = Object.values(AI_PLACEHOLDER_IDS);
    const elements = excalidrawApi.getSceneElements();
    const updatedElements = elements.filter(
      (element) => !placeholderIds.includes(element.id),
    );

    excalidrawApi.updateScene({ elements: updatedElements });
  };






  return (
    <div
      className="
        absolute
        right-6
        bottom-24
        z-50
        flex
        w-[400px]
        max-w-[calc(100vw-32px)]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-[0_20px_60px_rgba(15,23,42,0.15)]
      "
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-slate-900
                text-white
                shadow-sm
              "
            >
              <Sparkles size={19} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">AI Assistant</h2>

                <span
                  className="
                    rounded-full
                    bg-emerald-50
                    px-2
                    py-0.5
                    text-[10px]
                    font-medium
                    text-emerald-600
                  "
                >
                  AI
                </span>
              </div>

              <p className="mt-0.5 text-xs text-slate-400">Turn your ideas into visuals</p>
            </div>
          </div>

          <button
            type="button"
            title="Close"
            aria-label="Close AI assistant"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        <div className="p-5">
          <div className="mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Choose a tool
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {AiTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.name;

              return (
                <button
                  key={tool.name}
                  type="button"
                  onClick={() => setSelectedTool(tool.name)}
                  className={`
                    group
                    relative
                    flex
                    min-h-[92px]
                    flex-col
                    items-start
                    rounded-xl
                    border
                    p-3
                    text-left
                    transition-all
                    duration-150
                    ${
                      isSelected
                        ? "border-slate-300 bg-slate-50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }
                  `}
                >
                  {isSelected && (
                    <span
                      className="
                        absolute
                        right-2.5
                        top-2.5
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-slate-900
                      "
                    />
                  )}

                  <div
                    className={`
                      mb-2
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      ${tool.bg}
                      ${tool.color}
                      transition-transform
                      group-hover:scale-105
                    `}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </div>

                  <span className="text-xs font-semibold text-slate-800">{tool.name}</span>

                  <span className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                    {tool.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-5 h-px bg-slate-100" />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="ai-prompt" className="text-sm font-semibold text-slate-800">
                What do you want to create?
              </label>

              <span className="text-[10px] text-slate-400">{selectedTool}</span>
            </div>

            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                transition
                focus-within:border-slate-400
                focus-within:bg-white
                focus-within:ring-2
                focus-within:ring-slate-100
              "
            >
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe your idea..."
                className="
                  min-h-[105px]
                  resize-none
                  border-0
                  bg-transparent
                  px-3.5
                  py-3
                  text-sm
                  text-slate-700
                  shadow-none
                  outline-none
                  placeholder:text-slate-400
                  focus-visible:ring-0
                "
              />

              <div className="flex items-center justify-between border-t border-slate-100 px-2.5 py-2">
                <span className="text-[10px] text-slate-400">Describe what you need</span>
                <span className="text-[10px] text-slate-300">AI powered</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="
              mt-3
              flex
              h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-slate-900
              text-sm
              font-medium
              text-white
              shadow-sm
              transition-all
              hover:bg-slate-800
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
            onClick={onClickGenerate}
            disabled={loading}
          >
            {loading && <Loader2Icon className="animate-spin" />}
            <span>Generate</span>
            <ArrowUp size={15} />
          </button>

          <p className="mt-3 text-center text-[10px] text-slate-400">
            AI generated content can be edited after creation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIFloatingSiderbar;
