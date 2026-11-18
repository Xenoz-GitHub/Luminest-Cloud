export interface AccentPreset {
  id: string;
  label: string;
  /** Hex used for the swatch preview only. */
  swatch: string;
}

/**
 * Accent presets. The actual color variables live in globals.css under
 * [data-accent="<id>"], which is why switching is instant and needs no reload.
 */
export const ACCENTS: AccentPreset[] = [
  { id: "lavender", label: "Lavender", swatch: "#B9A5EA" },
  { id: "rose", label: "Rose", swatch: "#F4A4B9" },
  { id: "burgundy", label: "Burgundy", swatch: "#A84A62" },
  { id: "gold", label: "Gold", swatch: "#E8BE6A" },
  { id: "emerald", label: "Emerald", swatch: "#7AC8A4" },
  { id: "ocean", label: "Ocean", swatch: "#7EB0E0" },
  { id: "cherry", label: "Cherry", swatch: "#EC7C7C" },
  { id: "slate", label: "Slate", swatch: "#949EB2" },
];

export const DEFAULT_ACCENT = "lavender";
export const ACCENT_STORAGE_KEY = "luminest-accent";

export function isAccentId(value: string | null | undefined): value is string {
  return Boolean(value) && ACCENTS.some((accent) => accent.id === value);
}

export function applyAccent(id: string) {
  if (typeof document === "undefined") return;
  const safe = isAccentId(id) ? id : DEFAULT_ACCENT;
  document.documentElement.setAttribute("data-accent", safe);
}
