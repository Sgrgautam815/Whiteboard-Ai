"use client";

import React, { useState } from "react";
import {
  Pencil,
  Highlighter,
  Paintbrush,
  Feather,
  Sparkles,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

export type PencilDesign = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  strokeWidth: number;
  strokeColor: string;
  strokeStyle: "solid" | "dashed" | "dotted";
  roughness: number;
  opacity: number;
};

const PENCIL_DESIGNS: PencilDesign[] = [
  {
    id: "standard",
    name: "Standard Pen",
    description: "Classic smooth pencil line",
    icon: Pencil,
    strokeWidth: 2,
    strokeColor: "#1e293b",
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
  },
  {
    id: "highlighter",
    name: "Highlighter",
    description: "Wide translucent marker",
    icon: Highlighter,
    strokeWidth: 16,
    strokeColor: "#facc15",
    strokeStyle: "solid",
    roughness: 0,
    opacity: 35,
  },
  {
    id: "sketch",
    name: "Artist Sketch",
    description: "Textured hand-drawn look",
    icon: Paintbrush,
    strokeWidth: 4,
    strokeColor: "#475569",
    strokeStyle: "solid",
    roughness: 2,
    opacity: 90,
  },
  {
    id: "calligraphy",
    name: "Fine Calligraphy",
    description: "Crisp precision pen",
    icon: Feather,
    strokeWidth: 1,
    strokeColor: "#000000",
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
  },
  {
    id: "dotted",
    name: "Dotted Pencil",
    description: "Dotted pattern stroke",
    icon: Sparkles,
    strokeWidth: 3,
    strokeColor: "#2563eb",
    strokeStyle: "dotted",
    roughness: 1,
    opacity: 100,
  },
  {
    id: "dashed",
    name: "Dashed Line",
    description: "Dashed style marker",
    icon: SlidersHorizontal,
    strokeWidth: 5,
    strokeColor: "#dc2626",
    strokeStyle: "dashed",
    roughness: 1,
    opacity: 90,
  },
];

const PRESET_COLORS = [
  "#000000",
  "#1e293b",
  "#475569",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#facc15",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#ffffff",
];

const QUICK_SIZES = [
  { label: "Fine", value: 1 },
  { label: "Thin", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Thick", value: 8 },
  { label: "Marker", value: 14 },
  { label: "Brush", value: 20 },
];

type Props = {
  currentStrokeWidth: number;
  currentStrokeColor: string;
  currentStrokeStyle: string;
  currentRoughness: number;
  currentOpacity: number;
  onChange: (property: string, value: unknown) => void;
  onClose: () => void;
};

export default function PencilBoxPopup({
  currentStrokeWidth = 2,
  currentStrokeColor = "#1e293b",
  currentStrokeStyle = "solid",
  currentRoughness = 1,
  currentOpacity = 100,
  onChange,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"designs" | "custom">("designs");

  const applyPreset = (design: PencilDesign) => {
    onChange("strokeWidth", design.strokeWidth);
    onChange("strokeColor", design.strokeColor);
    onChange("strokeStyle", design.strokeStyle);
    onChange("roughness", design.roughness);
    onChange("opacity", design.opacity);
  };

  const getDashArray = () => {
    if (currentStrokeStyle === "dashed") return "8, 6";
    if (currentStrokeStyle === "dotted") return "3, 5";
    return "none";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center sm:justify-start sm:left-20 sm:top-24 sm:inset-auto"
      onClick={onClose}
    >
      <div
        className="w-[min(94vw,380px)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Pencil size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Pencil & Brush Tools</h3>
              <p className="text-[11px] text-slate-500">Size, color & stroke styles</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pencil popup"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Stroke Preview Bar */}
        <div className="my-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Live Stroke Preview</span>
            <span className="font-mono text-slate-700">
              {currentStrokeWidth}px • {currentOpacity}%
            </span>
          </div>
          <div className="h-10 w-full overflow-hidden flex items-center justify-center bg-white rounded-lg border border-slate-100 shadow-inner px-4">
            <svg className="w-full h-8" viewBox="0 0 300 30">
              <path
                d="M 10 15 Q 80 5, 150 15 T 290 15"
                fill="none"
                stroke={currentStrokeColor}
                strokeWidth={currentStrokeWidth}
                strokeDasharray={getDashArray()}
                strokeLinecap="round"
                opacity={currentOpacity / 100}
              />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-3 rounded-xl bg-slate-100 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("designs")}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === "designs"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pencil Styles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === "custom"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Custom Adjust
          </button>
        </div>

        {/* Tab Content 1: Pencil Designs */}
        {activeTab === "designs" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
              {PENCIL_DESIGNS.map((design) => {
                const Icon = design.icon;
                const isSelected =
                  currentStrokeWidth === design.strokeWidth &&
                  currentStrokeStyle === design.strokeStyle &&
                  currentRoughness === design.roughness;

                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => applyPreset(design)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full mb-1">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${design.strokeColor}15`,
                          color: design.strokeColor,
                        }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {design.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {design.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Color Picker */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Pencil Color
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange("strokeColor", color)}
                    aria-label={`Select color ${color}`}
                    className={`h-6 w-6 rounded-full border transition hover:scale-110 ${
                      currentStrokeColor === color
                        ? "ring-2 ring-blue-600 ring-offset-1 border-transparent scale-105"
                        : "border-slate-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    id="pencil-custom-color"
                    value={currentStrokeColor}
                    onChange={(e) => onChange("strokeColor", e.target.value)}
                    className="h-6 w-6 opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <div className="h-6 w-6 rounded-full border border-slate-300 bg-gradient-to-tr from-rose-400 via-sky-400 to-amber-300 flex items-center justify-center text-[9px] font-bold text-slate-700 shadow-sm cursor-pointer">
                    +
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Custom Adjustments */}
        {activeTab === "custom" && (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-0.5">
            {/* Size / Stroke Width */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Pencil Size (Thickness)
                </label>
                <span className="text-xs font-mono font-medium text-blue-600">
                  {currentStrokeWidth}px
                </span>
              </div>
              <div className="flex gap-1 mb-2">
                {QUICK_SIZES.map((qs) => (
                  <button
                    key={qs.value}
                    type="button"
                    onClick={() => onChange("strokeWidth", qs.value)}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-lg border transition ${
                      currentStrokeWidth === qs.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {qs.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={currentStrokeWidth}
                onChange={(e) => onChange("strokeWidth", Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Line Style (Solid, Dashed, Dotted) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stroke Design / Pattern
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Solid", value: "solid", dashes: "none" },
                  { label: "Dashed", value: "dashed", dashes: "6, 4" },
                  { label: "Dotted", value: "dotted", dashes: "2, 3" },
                ].map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => onChange("strokeStyle", style.value)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition ${
                      currentStrokeStyle === style.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{style.label}</span>
                    <svg className="w-12 h-2" viewBox="0 0 50 10">
                      <line
                        x1="0"
                        y1="5"
                        x2="50"
                        y2="5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={style.dashes}
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Roughness / Sketch Feel */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Roughness (Texture Feel)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Sleek", desc: "Digital", value: 0 },
                  { label: "Natural", desc: "Hand-drawn", value: 1 },
                  { label: "Sketchy", desc: "Rough", value: 2 },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onChange("roughness", r.value)}
                    className={`flex flex-col items-center p-1.5 rounded-xl border text-xs transition ${
                      currentRoughness === r.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-semibold">{r.label}</span>
                    <span className="text-[10px] opacity-75">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Opacity (Transparency)
                </label>
                <span className="text-xs font-mono font-medium text-blue-600">
                  {currentOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={currentOpacity}
                onChange={(e) => onChange("opacity", Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => applyPreset(PENCIL_DESIGNS[0])}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw size={13} />
            Reset to default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
