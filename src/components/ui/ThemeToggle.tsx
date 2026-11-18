"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyThemePreference,
  resolveDark,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
    return subscribeTheme((pref: ThemePreference) => setDark(resolveDark(pref)));
  }, []);

  function toggle() {
    const next: ThemePreference = dark ? "light" : "dark";
    applyThemePreference(next);
    setDark(next === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className="grid h-10 w-10 place-items-center rounded-full border-2 border-line bg-surface/80 text-ink shadow-toony-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none"
    >
      {mounted && dark ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
