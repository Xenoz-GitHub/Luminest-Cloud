export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "luminest-theme";
export const THEME_EVENT = "luminest:theme";

/** Resolve a preference to whether dark mode is active right now. */
export function resolveDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Storage can be unavailable in private modes.
  }
  return "system";
}

/**
 * Apply a preference everywhere: DOM class, color-scheme, storage, and a global
 * event so every mounted control (navbar toggle, profile picker, sidebar)
 * re-renders in sync.
 */
export function applyThemePreference(pref: ThemePreference): void {
  if (typeof document === "undefined") return;
  const dark = resolveDark(pref);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent<ThemePreference>(THEME_EVENT, { detail: pref }));
}

/**
 * Subscribe to theme changes from any component. Also reacts to OS changes while
 * the preference is "system" and to cross-tab storage updates.
 */
export function subscribeTheme(cb: (pref: ThemePreference) => void): () => void {
  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent<ThemePreference>).detail;
    cb(detail ?? readThemePreference());
  };

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (readThemePreference() === "system") {
      applyThemePreference("system");
    }
  };

  window.addEventListener(THEME_EVENT, onEvent);
  window.addEventListener("storage", onEvent);
  media.addEventListener("change", onMedia);

  return () => {
    window.removeEventListener(THEME_EVENT, onEvent);
    window.removeEventListener("storage", onEvent);
    media.removeEventListener("change", onMedia);
  };
}
