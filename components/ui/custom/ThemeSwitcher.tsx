"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, ChevronDown, Check } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />
    );
  }

  const currentIcon = () => {
    if (theme === "system") return <Laptop size={15} className="text-blue-500" />;
    return resolvedTheme === "dark" ? (
      <Moon size={15} className="text-indigo-400" />
    ) : (
      <Sun size={15} className="text-amber-500" />
    );
  };

  const currentLabel = () => {
    if (theme === "system") return "System";
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Switch theme"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {currentIcon()}
        <span className="hidden sm:inline">{currentLabel()}</span>
        <ChevronDown size={13} className="text-slate-400 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900 dark:ring-white/10">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Appearance
          </div>

          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              theme === "light"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun size={14} className="text-amber-500" />
              Light
            </span>
            {theme === "light" && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              theme === "dark"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon size={14} className="text-indigo-400" />
              Dark
            </span>
            {theme === "dark" && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              theme === "system"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop size={14} className="text-blue-500" />
              System
            </span>
            {theme === "system" && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
