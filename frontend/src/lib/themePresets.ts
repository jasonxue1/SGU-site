/** 与 styles.css :root 默认四色一致，用于全站主题预设与自定义填充 */
export const THEME_PRESET_IDS = ["default", "ocean", "forest", "lavender", "slate", "custom"] as const;
export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export type CustomPalette = Partial<{
  p1: string;
  p2: string;
  p3: string;
  p4: string;
}>;

const DEFAULT: [string, string, string, string] = ["#f5e0c3", "#e3c4a8", "#c89f94", "#b67162"];

const PRESET_PALETTES: Record<Exclude<ThemePresetId, "custom">, [string, string, string, string]> = {
  default: DEFAULT,
  ocean: ["#e0f2fe", "#7dd3fc", "#38bdf8", "#0369a1"],
  forest: ["#ecfccb", "#bef264", "#65a30d", "#3f6212"],
  lavender: ["#f3e8ff", "#d8b4fe", "#a855f7", "#6b21a8"],
  slate: ["#f1f5f9", "#cbd5e1", "#64748b", "#334155"],
};

export const THEME_PRESET_LABELS: Record<Exclude<ThemePresetId, "custom">, string> = {
  default: "暖陶土（默认）",
  ocean: "海洋蓝",
  forest: "森林绿",
  lavender: "薰衣草紫",
  slate: "岩灰蓝",
};

export function getPaletteTuple(preset: ThemePresetId | undefined, custom: CustomPalette | null | undefined): [string, string, string, string] {
  const id = preset ?? "default";
  const base = id === "custom" ? DEFAULT : PRESET_PALETTES[id] ?? DEFAULT;
  if (id !== "custom" || !custom) return base;
  return [
    custom.p1?.trim() || base[0],
    custom.p2?.trim() || base[1],
    custom.p3?.trim() || base[2],
    custom.p4?.trim() || base[3],
  ];
}

export function applyPaletteCssVars(root: HTMLElement, tuple: [string, string, string, string]) {
  const [p1, p2, p3, p4] = tuple;
  root.style.setProperty("--palette-1", p1);
  root.style.setProperty("--palette-2", p2);
  root.style.setProperty("--palette-3", p3);
  root.style.setProperty("--palette-4", p4);
}
