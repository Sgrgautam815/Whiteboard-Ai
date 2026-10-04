"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { User, Sun, Moon, Save, Sliders, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { user } = useUser();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(10);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [exportQuality, setExportQuality] = useState<string>("high");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load persisted preferences
    const savedTheme = localStorage.getItem("app_theme") as "light" | "dark" | null;
    const savedInterval = localStorage.getItem("app_autosave_interval");
    const savedGrid = localStorage.getItem("app_show_grid");
    const savedQuality = localStorage.getItem("app_export_quality");

    if (savedTheme) setTheme(savedTheme);
    if (savedInterval) setAutoSaveInterval(Number(savedInterval));
    if (savedGrid !== null) setShowGrid(savedGrid === "true");
    if (savedQuality) setExportQuality(savedQuality);
  }, []);

  const handleSaveSettings = () => {
    setSaving(true);
    localStorage.setItem("app_theme", theme);
    localStorage.setItem("app_autosave_interval", String(autoSaveInterval));
    localStorage.setItem("app_show_grid", String(showGrid));
    localStorage.setItem("app_export_quality", exportQuality);

    setTimeout(() => {
      setSaving(false);
      toast.add({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
        type: "success",
      });
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account details and workspace preferences.
        </p>
      </div>

      {/* Account / Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <User className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Account Profile</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={user?.imageUrl ?? "/default-profile.png"}
            alt="Profile Avatar"
            className="h-16 w-16 rounded-full border-2 border-slate-100 object-cover shadow-sm"
          />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              {user?.firstName} {user?.lastName}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Verified Auth
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              {user?.primaryEmailAddress?.emailAddress ?? "No email provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Appearance & Workspace Preferences */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Sliders className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-slate-800">Workspace Preferences</h2>
        </div>

        {/* Theme Preference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="text-sm font-semibold text-slate-800 block">Appearance Theme</label>
            <p className="text-xs text-slate-400">Choose your preferred application theme mode.</p>
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                theme === "light"
                  ? "border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Sun size={18} className="text-amber-500" />
              Light Mode
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                theme === "dark"
                  ? "border-blue-600 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Moon size={18} className="text-indigo-400" />
              Dark Mode
            </button>
          </div>
        </div>

        {/* Auto Save Interval */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-4 border-t border-slate-100">
          <div>
            <label className="text-sm font-semibold text-slate-800 block">Auto-Save Frequency</label>
            <p className="text-xs text-slate-400">Frequency of auto-saving whiteboard changes.</p>
          </div>
          <div className="sm:col-span-2">
            <select
              value={autoSaveInterval}
              onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={5}>Every 5 Seconds</option>
              <option value={10}>Every 10 Seconds (Recommended)</option>
              <option value={30}>Every 30 Seconds</option>
              <option value={60}>Every 1 Minute</option>
            </select>
          </div>
        </div>

        {/* Show Grid Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-4 border-t border-slate-100">
          <div>
            <label className="text-sm font-semibold text-slate-800 block">Canvas Background Grid</label>
            <p className="text-xs text-slate-400">Display background alignment grid on whiteboards.</p>
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="grid-toggle"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="grid-toggle" className="text-sm font-medium text-slate-700 cursor-pointer">
              Enable Canvas Grid Lines
            </label>
          </div>
        </div>

        {/* Export Quality */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-4 border-t border-slate-100">
          <div>
            <label className="text-sm font-semibold text-slate-800 block">Image Export Quality</label>
            <p className="text-xs text-slate-400">Default resolution multiplier when exporting diagrams.</p>
          </div>
          <div className="sm:col-span-2">
            <select
              value={exportQuality}
              onChange={(e) => setExportQuality(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="standard">Standard Quality (1x)</option>
              <option value="high">High Quality (2x PNG)</option>
              <option value="ultra">Ultra Ultra High Quality (3x HD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <CheckCircle2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
        </button>
      </div>
    </div>
  );
}
