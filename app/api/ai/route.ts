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
  const source = diagram && typeof diagram === "object" ? diagram as Record<string, unknown> : {};
  const rawElements = Array.isArray(source.elements) ? source.elements : [];
  const rawConnections = Array.isArray(source.connections) ? source.connections : [];
  const elements = rawElements
    .filter((node): node is Record<string, unknown> => Boolean(node) && typeof node === "object")
    .slice(0, 12)
    .map((node, index) => {
      const id = cleanLabel(node.id, `node-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `node-${index + 1}`;
      const palette = PALETTE[index % PALETTE.length];
      const rawType = typeof node.type === "string" ? node.type : "rectangle";
      const column = index % 3;
      const row = Math.floor(index / 3);

      return {
        id,
        type: ALLOWED_NODE_TYPES.has(rawType) ? rawType : "rectangle",
        label: cleanLabel(node.label, `Step ${index + 1}`),
        x: Number.isFinite(Number(node.x)) ? Number(node.x) : column * 320,
        y: Number.isFinite(Number(node.y)) ? Number(node.y) : row * 170,
        width: Math.min(300, Math.max(180, Number(node.width) || 240)),
        height: Math.min(150, Math.max(80, Number(node.height) || 96)),
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

    const finalPrompt = `${systemPrompt}
User Request: ${userInput}

Create a useful, complete, presentation-ready diagram.

Quality rules:
- Produce 6 to 10 nodes unless the request is very small.
- Use short labels: 2 to 6 words per node, no paragraphs.
- Include meaningful connection labels only when they clarify the relationship.
- Arrange nodes with no overlap.
- Use coordinates in a clean grid. Start near x=0, y=0. Use spacing of about 300 horizontally and 170 vertically.
- Use width 220-280 and height 80-120.
- Use a tasteful mixed color palette. Avoid all-white diagrams.
- For Flowchart: use one start ellipse, one end ellipse, rectangles for actions, diamonds for decisions.
- For Architecture: lay out users/client on the left, services in the center, data/external systems on the right.
- For Web Mockup or Mobile Mockup: represent screens/sections as logical wireframe blocks and connect related flows.

Return only valid JSON in this exact logical format:
{
  "title": "string",
  "elements": [{
    "id": "unique-id",
    "type": "rectangle | diamond | ellipse",
    "label": "string",
    "x": 100,
    "y": 100,
    "width": 220,
    "height": 80,
    "strokeColor": "#1f2937",
    "backgroundColor": "#ffffff"
  }],
  "connections": [{
    "id": "connection-1",
    "from": "source-element-id",
    "to": "target-element-id",
    "label": "optional label"
  }]
}

Do not return markdown, comments, arrays outside the object, or Excalidraw internals. Use only rectangle, diamond, or ellipse elements. Create a professional ${type} with clear labels and connections.`;

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
