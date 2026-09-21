"use client";

import { StickyNote, SquareStack, ListChecks, X } from "lucide-react";

type NoteType = "sticky" | "glass" | "task";

type Props = {
  onSelect: (type: NoteType) => void;
  onClose: () => void;
};

const noteStyles = [
  {
    type: "sticky" as const,
    title: "Sticky Note",
    description: "Warm idea card",
    icon: StickyNote,
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    type: "glass" as const,
    title: "Glass Note",
    description: "Polished meeting note",
    icon: SquareStack,
    color: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    type: "task" as const,
    title: "Task Card",
    description: "Structured checklist tile",
    icon: ListChecks,
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
];

export default function NotesPicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-[60]" onClick={onClose}>
      <div
        className="absolute bottom-20 left-1/2 w-[min(92vw,390px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add notes</h2>
            <p className="mt-1 text-xs text-slate-500">Pick a blank note style for the whiteboard.</p>
          </div>
          <button type="button" title="Close notes" aria-label="Close notes" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {noteStyles.map((note) => {
            const Icon = note.icon;
            return (
              <button
                key={note.type}
                type="button"
                onClick={() => onSelect(note.type)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${note.color}`}>
                  <Icon size={19} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{note.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{note.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { NoteType };
