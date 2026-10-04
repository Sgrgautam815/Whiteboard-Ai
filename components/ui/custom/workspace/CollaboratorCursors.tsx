"use client";

import React from "react";
import { CollaboratorCursor } from "@/hooks/useCollaboration";
import { MousePointer2 } from "lucide-react";

type Props = {
  cursors: CollaboratorCursor[];
  scrollX?: number;
  scrollY?: number;
  zoom?: number;
};

export function CollaboratorCursors({ cursors, scrollX = 0, scrollY = 0, zoom = 1 }: Props) {
  if (!cursors || cursors.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {cursors.map((c) => {
        const user = c.user || {};
        const name = user.name || "Collaborator";
        const color = user.color || "#2563eb";

        // Adjust cursor coordinates according to Excalidraw pan & zoom
        const screenX = (c.x + scrollX) * zoom;
        const screenY = (c.y + scrollY) * zoom;

        return (
          <div
            key={c.socketId}
            className="absolute transition-all duration-75 ease-out flex items-center gap-1"
            style={{
              transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
            }}
          >
            {/* Custom Mouse Cursor Pointer */}
            <MousePointer2
              size={20}
              style={{
                color: color,
                fill: color,
                stroke: "#ffffff",
                strokeWidth: 1.5,
              }}
              className="drop-shadow-sm"
            />

            {/* Name Badge Label */}
            <div
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-md flex items-center gap-1.5 whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              <span>{name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
