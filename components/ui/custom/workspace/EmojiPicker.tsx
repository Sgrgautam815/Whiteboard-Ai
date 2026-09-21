"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, Heart, Search, Smile, Star, X, Zap } from "lucide-react";

type EmojiItem = { emoji: string; name: string };
type IconItem = { symbol: string; name: string; icon: typeof Circle };
type Props = {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
};

const emojiGroups: Record<string, EmojiItem[]> = {
  "Frequently Used": [
    { emoji: "😀", name: "grinning smile" },
    { emoji: "❤️", name: "red heart love" },
    { emoji: "✨", name: "sparkles" },
  ],
  "Smileys & People": [
    { emoji: "😀", name: "grinning smile" }, { emoji: "😃", name: "happy smile" }, { emoji: "😄", name: "smile" },
    { emoji: "😁", name: "grin" }, { emoji: "😂", name: "joy laugh" }, { emoji: "🤣", name: "rofl laugh" },
    { emoji: "🙂", name: "slight smile" }, { emoji: "😉", name: "wink" }, { emoji: "😊", name: "blush smile" },
    { emoji: "🥰", name: "love face" }, { emoji: "😍", name: "heart eyes love" }, { emoji: "🤩", name: "star struck" },
    { emoji: "😎", name: "cool sunglasses" }, { emoji: "🥳", name: "party celebrate" }, { emoji: "🤔", name: "thinking" },
  ],
  "Animals & Nature": [
    { emoji: "🐶", name: "dog" }, { emoji: "🐱", name: "cat" }, { emoji: "🦊", name: "fox" },
    { emoji: "🐻", name: "bear" }, { emoji: "🦋", name: "butterfly" }, { emoji: "🌿", name: "leaf nature" },
  ],
  "Food & Drink": [
    { emoji: "🍎", name: "apple fruit" }, { emoji: "🍕", name: "pizza" }, { emoji: "☕", name: "coffee" },
    { emoji: "🍔", name: "burger" }, { emoji: "🍰", name: "cake" },
  ],
  Activities: [
    { emoji: "⚽", name: "soccer" }, { emoji: "🎨", name: "art" }, { emoji: "🎵", name: "music" },
    { emoji: "🎉", name: "party" },
  ],
  "Travel & Places": [
    { emoji: "✈️", name: "airplane travel" }, { emoji: "🚗", name: "car" }, { emoji: "🏠", name: "home" },
    { emoji: "🌎", name: "world" },
  ],
  Objects: [
    { emoji: "💡", name: "idea light bulb" }, { emoji: "📌", name: "pin" }, { emoji: "💻", name: "computer" },
    { emoji: "📁", name: "folder" },
  ],
  Symbols: [
    { emoji: "✅", name: "check" }, { emoji: "❌", name: "cross" }, { emoji: "⭐", name: "star" },
    { emoji: "❤️", name: "heart love" }, { emoji: "⚡", name: "bolt" },
  ],
};

const iconItems: IconItem[] = [
  { symbol: "★", name: "star", icon: Star },
  { symbol: "♥", name: "heart", icon: Heart },
  { symbol: "⚡", name: "zap", icon: Zap },
  { symbol: "●", name: "circle", icon: Circle },
  { symbol: "☺", name: "smile", icon: Smile },
];

export default function EmojiPicker({ onSelectEmoji, onClose }: Props) {
  const [tab, setTab] = useState<"emoji" | "icons">("emoji");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Frequently Used");
  const [recent, setRecent] = useState<EmojiItem[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("whiteboard-recent-emojis") || "[]");
      if (Array.isArray(saved)) setRecent(saved);
    } catch {
      setRecent([]);
    }
  }, []);

  const emojiResults = useMemo(() => {
    const source = search.trim()
      ? Object.values(emojiGroups).flat()
      : category === "Frequently Used" && recent.length
        ? recent
        : emojiGroups[category] || [];
    const unique = source.filter((item, index, list) => list.findIndex((other) => other.emoji === item.emoji) === index);
    return search.trim()
      ? unique.filter((item) => item.name.includes(search.trim().toLowerCase()) || item.emoji.includes(search.trim()))
      : unique;
  }, [category, recent, search]);

  const selectEmoji = (item: EmojiItem) => {
    const next = [item, ...recent.filter((recentItem) => recentItem.emoji !== item.emoji)].slice(0, 16);
    setRecent(next);
    localStorage.setItem("whiteboard-recent-emojis", JSON.stringify(next));
    onSelectEmoji(item.emoji);
  };

  const filteredIcons = iconItems.filter((item) => item.name.includes(search.trim().toLowerCase()));

  return (
    <div className="absolute inset-0 z-[60]" onClick={onClose}>
      <div className="absolute bottom-20 left-1/2 w-[min(94vw,440px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Emoji and icons</h2>
            <p className="mt-1 text-xs text-slate-500">Choose from the picker or scroll the icon library.</p>
          </div>
          <button type="button" title="Close emoji picker" aria-label="Close emoji picker" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="mb-3 flex rounded-lg bg-slate-100 p-1">
          {(["emoji", "icons"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize ${tab === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{value}</button>
          ))}
        </div>
        <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="w-full bg-transparent text-sm outline-none" />
        </label>
        {tab === "emoji" ? (
          <>
            <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
              {Object.keys(emojiGroups).map((name) => <button key={name} type="button" onClick={() => { setCategory(name); setSearch(""); }} className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] ${category === name ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{name}</button>)}
            </div>
            <p className="mb-2 text-xs font-semibold text-slate-500">{search ? "Search results" : category}</p>
            {emojiResults.length ? <div className="grid max-h-52 grid-cols-8 gap-1 overflow-y-auto">{emojiResults.map((item) => <button key={`${item.emoji}-${item.name}`} type="button" title={item.name} aria-label={`Add ${item.emoji}`} onClick={() => selectEmoji(item)} className="rounded-lg p-2 text-2xl hover:bg-slate-100">{item.emoji}</button>)}</div> : <p className="py-8 text-center text-sm text-slate-400">No emojis found</p>}
          </>
        ) : (
          <div className="grid grid-cols-5 gap-2">{filteredIcons.map((item) => { const Icon = item.icon; return <button key={item.name} type="button" title={item.name} aria-label={`Add ${item.name}`} onClick={() => onSelectEmoji(item.symbol)} className="flex flex-col items-center gap-1 rounded-xl p-3 hover:bg-slate-100"><Icon size={22} /><span className="text-[10px] text-slate-500">{item.name}</span></button>; })}</div>
        )}
      </div>
    </div>
  );
}
