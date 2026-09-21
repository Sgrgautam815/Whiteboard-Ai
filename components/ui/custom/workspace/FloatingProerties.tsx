"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type IconProps = { size?: number; className?: string };
type Position = { left: number; top: number };
type PropertyChange = (property: string, value: unknown) => void;

type Props = {
  selectedElement: Record<string, unknown> | null;
  position: Position;
  onPropertyChange: PropertyChange;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
};

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

function SvgIcon({ children, size = 20, className }: IconProps & { children: ReactNode }) {
  return <svg aria-hidden="true" className={className} height={size} viewBox="0 0 24 24" width={size} {...iconProps}>{children}</svg>;
}

function GripIcon(props: IconProps) {
  return <SvgIcon {...props}>{[7, 12, 17].flatMap((y) => [8, 16].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" />))}</SvgIcon>;
}

function ElementIcon({ type, ...props }: IconProps & { type: string }) {
  return (
    <SvgIcon {...props}>
      {type === "rectangle" && <rect x="5" y="5" width="14" height="14" rx="2" />}
      {type === "ellipse" && <ellipse cx="12" cy="12" rx="7" ry="5.5" />}
      {type === "diamond" && <path d="m12 4 7 8-7 8-7-8 7-8Z" />}
      {type === "line" && <path d="m5 19 14-14" />}
      {type === "arrow" && <path d="M5 19 19 5m0 0h-7m7 0v7" />}
      {type === "text" && <path d="M6 6h12M12 6v12m-3 0h6" />}
      {type === "freedraw" && <path d="m5 18 2.5-6.5L16 3l3 3-8.5 8.5L5 18Zm0 0 4.5-1.5" />}
    </SvgIcon>
  );
}

function BucketIcon(props: IconProps) {
  return <SvgIcon {...props}><path d="m6 13 5-8 7 4-5 8a3 3 0 0 1-5.2.2L6 13Z" /><path d="M13 17c1.2 1.5 2.5 2.2 4 2.2 1.2 0 2-.6 2-1.5 0-.8-.7-1.4-1.8-1.7" /></SvgIcon>;
}

function DropletIcon(props: IconProps) {
  return <SvgIcon {...props}><path d="M12 4s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" /></SvgIcon>;
}

function DuplicateIcon(props: IconProps) {
  return <SvgIcon {...props}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></SvgIcon>;
}

function LockIcon({ locked, ...props }: IconProps & { locked: boolean }) {
  return <SvgIcon {...props}><rect x="5" y="10" width="14" height="10" rx="2" />{locked ? <path d="M8 10V7a4 4 0 0 1 8 0v3" /> : <path d="M16 10V7a4 4 0 0 0-7.2-2.4" />}</SvgIcon>;
}

function TrashIcon(props: IconProps) {
  return <SvgIcon {...props}><path d="M5 7h14M10 4h4M8 7l1 13h6l1-13M10 10v7m4-7v7" /></SvgIcon>;
}

function MoreIcon(props: IconProps) {
  return <SvgIcon {...props}><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></SvgIcon>;
}

function FloatingProperties({ selectedElement, position, onPropertyChange, onDuplicate, onToggleLock, onDelete, onBringToFront, onSendToBack }: Props) {
  const [dragOffset, setDragOffset] = useState({ left: 0, top: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;

    const closeOnOutsidePointer = (event: globalThis.PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [moreOpen]);

  if (!selectedElement) return null;

  const type = String(selectedElement.type ?? "selection");
  const isLocked = Boolean(selectedElement.locked);
  const fillColor = String(selectedElement.backgroundColor ?? "#ffffff");
  const strokeColor = String(selectedElement.strokeColor ?? "#1f2937");
  const strokeStyle = String(selectedElement.strokeStyle ?? "solid");
  const strokeWidth = Number(selectedElement.strokeWidth ?? 2);
  const opacity = Number(selectedElement.opacity ?? 100);

  const handleGripPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleGripPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStart) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOffset({ left: event.clientX - dragStart.x, top: event.clientY - dragStart.y });
  };

  const stopGripDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setDragStart(null);
  };

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label={`${type} properties`}
      className="absolute z-[100] flex h-12 max-w-[calc(100vw-16px)] -translate-x-1/2 -translate-y-full items-center rounded-full border border-slate-200 bg-white px-1.5 text-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.08)]"
      style={{ left: position.left + dragOffset.left, top: position.top - 8 + dragOffset.top }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ToolbarButton ariaLabel="Move toolbar" className="cursor-grab active:cursor-grabbing" onPointerDown={handleGripPointerDown} onPointerMove={handleGripPointerMove} onPointerUp={stopGripDrag} onPointerCancel={stopGripDrag}><GripIcon /></ToolbarButton>
      <Divider />
      <ToolbarButton ariaLabel={`${type} element`} title={type}><ElementIcon type={type} /></ToolbarButton>
      <ColorButton ariaLabel="Change background color" color={fillColor} icon={<BucketIcon />} onChange={(color) => onPropertyChange("backgroundColor", color)} title="Background color" />
      <ColorButton ariaLabel="Change stroke color" color={strokeColor} icon={<DropletIcon />} onChange={(color) => onPropertyChange("strokeColor", color)} title="Stroke color" />
      <Divider />
      <ToolbarButton ariaLabel="Duplicate element" title="Duplicate" onClick={onDuplicate}><DuplicateIcon /></ToolbarButton>
      <ToolbarButton ariaLabel={isLocked ? "Unlock element" : "Lock element"} title={isLocked ? "Unlock" : "Lock"} onClick={onToggleLock}><LockIcon locked={isLocked} /></ToolbarButton>
      <ToolbarButton ariaLabel="Delete element" title="Delete" danger onClick={onDelete}><TrashIcon /></ToolbarButton>
      <Divider />
      <div className="relative">
        <ToolbarButton ariaLabel="More options" title="More" onClick={() => setMoreOpen((open) => !open)}><MoreIcon /></ToolbarButton>
        {moreOpen && (
          <div className="absolute right-0 top-11 z-[110] min-w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            <ShapeOptions
              fillColor={fillColor}
              opacity={opacity}
              strokeColor={strokeColor}
              strokeStyle={strokeStyle}
              strokeWidth={strokeWidth}
              onPropertyChange={onPropertyChange}
              onBringToFront={() => { onBringToFront(); setMoreOpen(false); }}
              onSendToBack={() => { onSendToBack(); setMoreOpen(false); }}
            />
            <Divider />
            <MenuButton label={isLocked ? "Unlock" : "Lock"} onClick={() => { onToggleLock(); setMoreOpen(false); }} />
            <MenuButton label="Duplicate" onClick={() => { onDuplicate(); setMoreOpen(false); }} />
            <MenuButton danger label="Delete" onClick={() => { onDelete(); setMoreOpen(false); }} />
          </div>
        )}
      </div>
    </div>
  );
}

type ToolbarButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { ariaLabel: string; danger?: boolean };

function ToolbarButton({ ariaLabel, danger = false, className = "", children, ...props }: ToolbarButtonProps) {
  return <button {...props} type="button" aria-label={ariaLabel} className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-800"} ${className}`}>{children}</button>;
}

function ColorIndicator({ color }: { color: string }) {
  return <span aria-hidden="true" className="absolute bottom-1 h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />;
}

function ShapeOptions({
  fillColor,
  opacity,
  strokeColor,
  strokeStyle,
  strokeWidth,
  onPropertyChange,
  onBringToFront,
  onSendToBack,
}: {
  fillColor: string;
  opacity: number;
  strokeColor: string;
  strokeStyle: string;
  strokeWidth: number;
  onPropertyChange: PropertyChange;
  onBringToFront: () => void;
  onSendToBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const palette = ["#ffffff", "#f8d7da", "#ffe8a1", "#d3f9d8", "#cfe8ff", "#e5dbff"];

  return (
    <div className="w-60 space-y-3 p-2" onPointerDown={(event) => event.stopPropagation()}>
      <p className="px-1 text-xs font-semibold text-slate-900">Shape options</p>

      <div className="grid grid-cols-2 gap-1">
        <MenuButton label="Bring to front" onClick={onBringToFront} />
        <MenuButton label="Send to back" onClick={onSendToBack} />
      </div>

      <section className="space-y-2">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Stroke</p>
        <div className="flex gap-1">
          {(["solid", "dashed", "dotted"] as const).map((style) => (
            <button
              key={style}
              type="button"
              aria-pressed={strokeStyle === style}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs capitalize ${strokeStyle === style ? "border-slate-900 bg-slate-100" : "border-slate-200 hover:bg-slate-50"}`}
              onClick={() => onPropertyChange("strokeStyle", style)}
            >
              {style}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-2 px-1 text-xs text-slate-600">
          <span>Stroke width</span>
          <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" value={strokeWidth} onChange={(event) => onPropertyChange("strokeWidth", Number(event.target.value))}>
            <option value={1}>1 px - Thin</option>
            <option value={2}>2 px - Medium</option>
            <option value={4}>4 px - Bold</option>
            <option value={8}>8 px - Heavy</option>
          </select>
        </label>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Fill</p>
        <div className="flex items-center gap-2 px-1">
          {palette.map((color) => (
            <button key={color} type="button" aria-label={`Use fill ${color}`} aria-pressed={fillColor === color} className={`h-6 w-6 rounded-full border ${fillColor === color ? "ring-2 ring-slate-900 ring-offset-1" : "border-slate-300"}`} style={{ backgroundColor: color }} onClick={() => onPropertyChange("backgroundColor", color)} />
          ))}
          <button type="button" className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50" onClick={() => inputRef.current?.click()}>Custom</button>
          <input ref={inputRef} className="pointer-events-none absolute h-px w-px opacity-0" type="color" value={fillColor === "transparent" ? "#ffffff" : fillColor} onChange={(event) => onPropertyChange("backgroundColor", event.target.value)} aria-label="Custom fill color" />
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Opacity</p>
          <span className="text-xs text-slate-600">{opacity}%</span>
        </div>
        <input className="w-full accent-slate-800" type="range" min="0" max="100" value={opacity} onChange={(event) => onPropertyChange("opacity", Number(event.target.value))} aria-label="Opacity" />
      </section>
    </div>
  );
}

function ColorButton({ ariaLabel, color, icon, onChange, title }: { ariaLabel: string; color: string; icon: ReactNode; onChange: (color: string) => void; title: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputColor = color === "transparent" ? "#ffffff" : color;

  return (
    <div className="relative">
      <ToolbarButton ariaLabel={ariaLabel} title={title} onClick={() => inputRef.current?.click()}>
        {icon}
        <ColorIndicator color={color} />
      </ToolbarButton>
      <input ref={inputRef} aria-label={ariaLabel} className="pointer-events-none absolute h-px w-px opacity-0" type="color" value={inputColor} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function MenuButton({ danger = false, label, onClick }: { danger?: boolean; label: string; onClick: () => void }) {
  return <button type="button" className={`block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-slate-100 ${danger ? "text-rose-600" : "text-slate-700"}`} onClick={onClick}>{label}</button>;
}

function Divider() {
  return <div aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-slate-200" />;
}

export default FloatingProperties;
