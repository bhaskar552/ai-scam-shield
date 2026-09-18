"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-text-main mb-1">Settings</h2>
        <p className="text-sm text-text-muted">Manage your application preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-panel-main border border-border-main rounded-xl p-5">
          <h3 className="font-semibold text-text-main text-base mb-4">Appearance</h3>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-text-main">Theme Mode</p>
              <p className="text-xs text-text-muted mt-1">Switch between light and dark themes.</p>
            </div>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-panel-hover border border-border-main text-text-main text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
