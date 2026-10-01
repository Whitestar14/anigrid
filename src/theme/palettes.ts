export const THEME_PALETTES = [
  { id: "ios-dark", name: "Dark", mode: "dark" },
  { id: "ios-light", name: "Light", mode: "light" },
] as const;

export type ThemePaletteId = (typeof THEME_PALETTES)[number]["id"];

export const isKnownPalette = (id: string | undefined): boolean =>
  !!id && THEME_PALETTES.some((p) => p.id === id);

export const getContrastColor = (hex: string) => {
  if (hex === "transparent") return "var(--color-text)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};

export const accentForeground = (hex: string | undefined) => {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 186 ? "#000000" : "#ffffff";
};
