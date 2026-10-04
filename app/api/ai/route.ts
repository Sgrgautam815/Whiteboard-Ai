import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

const DEFAULT_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"];
const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const ALLOWED_NODE_TYPES = new Set(["rectangle", "diamond", "ellipse"]);
const PALETTE = [
  { strokeColor: "#2563eb", backgroundColor: "#dbeafe" },
  { strokeColor: "#16a34a", backgroundColor: "#dcfce7" },
  { strokeColor: "#7c3aed", backgroundColor: "#ede9fe" },
  { strokeColor: "#ea580c", backgroundColor: "#ffedd5" },
  { strokeColor: "#0891b2", backgroundColor: "#cffafe" },
  { strokeColor: "#be123c", backgroundColor: "#ffe4e6" },
  { strokeColor: "#475569", backgroundColor: "#f1f5f9" },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const errorRecord = error as Record<string, unknown>;
  const status = errorRecord.status ?? errorRecord.code;

  if (typeof status === "number") return status;

  const message = error instanceof Error ? error.message : "";

  try {
    const parsed = JSON.parse(message) as { error?: { code?: unknown } };
    return typeof parsed.error?.code === "number" ? parsed.error.code : undefined;
  } catch {
    return undefined;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown AI generation error.";
}

function isTransientError(error: unknown) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    (typeof status === "number" && TRANSIENT_STATUS_CODES.has(status)) ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes("rate limit")
  );
}

function stripJsonCodeFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

function cleanLabel(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned.slice(0, 56) : fallback;
}

function normalizeDiagram(diagram: unknown, type: string) {
  const source = diagram && typeof diagram === "object" ? (diagram as Record<string, unknown>) : {};
  const rawElements = Array.isArray(source.elements) ? source.elements : [];
  const rawConnections = Array.isArray(source.connections) ? source.connections : [];
  
  const lowerType = (type || "").toLowerCase();
  const totalCount = Math.min(15, rawElements.length);

  const elements = rawElements
    .filter((node): node is Record<string, unknown> => Boolean(node) && typeof node === "object")
    .slice(0, 15)
    .map((node, index) => {
      const id = cleanLabel(node.id, `node-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `node-${index + 1}`;
      const palette = PALETTE[index % PALETTE.length];
      const rawShape = typeof node.type === "string" ? node.type : "rectangle";
      
      // Calculate intelligent node positioning based on diagram type to prevent overlap
      let x = Number(node.x);
      let y = Number(node.y);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        if (lowerType.includes("mind map") || lowerType.includes("mindmap")) {
          if (index === 0) {
            x = 450;
            y = 300;
          } else {
            const angle = ((index - 1) * 2 * Math.PI) / Math.max(1, totalCount - 1);
            x = 450 + Math.cos(angle) * 320;
            y = 300 + Math.sin(angle) * 220;
          }
        } else if (lowerType.includes("flowchart") || lowerType.includes("workflow") || lowerType.includes("process")) {
          const col = index % 2;
          const row = Math.floor(index / 2);
          x = col === 0 ? 250 : 600;
          y = row * 160 + 50;
        } else if (lowerType.includes("architecture") || lowerType.includes("network") || lowerType.includes("system")) {
          const tier = index % 4;
          const rowInTier = Math.floor(index / 4);
          x = tier * 320 + 80;
          y = rowInTier * 180 + 80;
        } else if (lowerType.includes("sequence")) {
          x = index * 260 + 80;
          y = 80;
        } else {
          // Grid layout default for ER, Class, etc.
          const col = index % 3;
          const row = Math.floor(index / 3);
          x = col * 340 + 80;
          y = row * 180 + 80;
        }
      }

      return {
        id,
        type: ALLOWED_NODE_TYPES.has(rawShape) ? rawShape : "rectangle",
        label: cleanLabel(node.label, `Node ${index + 1}`),
        x: Math.round(x),
        y: Math.round(y),
        width: Math.min(320, Math.max(180, Number(node.width) || 240)),
        height: Math.min(160, Math.max(80, Number(node.height) || 96)),
        strokeColor: typeof node.strokeColor === "string" ? node.strokeColor : palette.strokeColor,
        backgroundColor: typeof node.backgroundColor === "string" ? node.backgroundColor : palette.backgroundColor,
      };
    });

  const elementIds = new Set(elements.map((node) => node.id));
  const connections = rawConnections
    .filter((connection): connection is Record<string, unknown> => Boolean(connection) && typeof connection === "object")
    .map((connection, index) => ({
      id: cleanLabel(connection.id, `connection-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `connection-${index + 1}`,
      from: typeof connection.from === "string" ? connection.from : "",
      to: typeof connection.to === "string" ? connection.to : "",
      label: typeof connection.label === "string" ? cleanLabel(connection.label, "") : "",
    }))
    .filter((connection) => elementIds.has(connection.from) && elementIds.has(connection.to));

  return {
    title: cleanLabel(source.title, type),
    elements,
    connections,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userInput, type, systemPrompt } = await req.json();
    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelList = [
      process.env["GEMINI_MODEL"],
      ...DEFAULT_MODELS,
    ].filter((model, index, models): model is string => Boolean(model) && models.indexOf(model) === index);

    const basePrompt = systemPrompt || `You are an expert visual diagram generation agent for ${type}. Create a clear, high-quality diagram with logically connected components.`;

    const finalPrompt = `${basePrompt}
User Goal / Idea: "${userInput}"
Diagram Type Required: "${type}"

Rules for output generation:
1. Produce 5 to 10 nodes with precise, meaningful labels (2-5 words each).
2. Choose shape types carefully:
   - "ellipse" for start/end, users, or root concepts.
   - "diamond" for decision nodes, gateways, or key conditions.
   - "rectangle" for processes, services, classes, databases, or components.
3. Provide valid non-overlapping coordinates (x, y) for nodes.
4. Provide meaningful connection edges ("from" node ID to "to" node ID) with optional descriptive relationship labels.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Short Title of Diagram",
  "elements": [
    {
      "id": "node-1",
      "type": "rectangle",
      "label": "Component Label",
      "x": 100,
      "y": 100,
      "width": 240,
      "height": 90,
      "strokeColor": "#2563eb",
      "backgroundColor": "#dbeafe"
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "node-1",
      "to": "node-2",
      "label": "submits data to"
    }
  ]
}`;

    let lastError: unknown;

    for (const model of modelList) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: finalPrompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const rawText = response.text || "{}";
          const diagramResult = normalizeDiagram(JSON.parse(stripJsonCodeFence(rawText)), type);

          if (diagramResult.elements.length < 2) {
            throw new Error("AI returned too few diagram elements.");
          }

          return Response.json({
            success: true,
            model,
            diagramResult,
          });
        } catch (error) {
          lastError = error;

          if (!isTransientError(error)) {
            throw error;
          }

          if (attempt < 2) {
            await wait(500);
          }
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error("AI generation failed:", error);

    const status = getErrorStatus(error);
    const message = isTransientError(error)
      ? "The AI model is busy right now. Please try again in a moment."
      : getErrorMessage(error);

    return Response.json(
      { error: message },
      { status: status && status >= 400 && status < 600 ? status : 500 },
    );
  }
}
