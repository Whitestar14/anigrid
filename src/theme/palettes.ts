export const THEME_PALETTES = [
  {
    id: "ios-dark",
    name: "iOS Dark",
    colors: {
      background: "#000000",
      surface: "#1c1c1e",
      border: "#38383a",
      text: "#ffffff",
      muted: "#98989d",
      hover: "rgba(255, 255, 255, 0.1)",
      overlay: "rgba(0, 0, 0, 0.6)",
    },
  },
  {
    id: "slate",
    name: "Slate",
    colors: {
      background: "#0f172a",
      surface: "#1e293b",
      border: "#334155",
      text: "#f1f5f9",
      muted: "#94a3b8",
      hover: "rgba(255, 255, 255, 0.08)",
      overlay: "rgba(15, 23, 42, 0.8)",
    },
  },
  {
    id: "oled",
    name: "OLED",
    colors: {
      background: "#000000",
      surface: "#0a0a0a",
      border: "#262626",
      text: "#e5e5e5",
      muted: "#737373",
      hover: "rgba(255, 255, 255, 0.1)",
      overlay: "rgba(0, 0, 0, 0.9)",
    },
  },
  {
    id: "cloud",
    name: "Cloud",
    colors: {
      background: "#ffffff",
      surface: "#f8fafc",
      border: "#e2e8f0",
      text: "#0f172a",
      muted: "#64748b",
      hover: "rgba(15, 23, 42, 0.05)",
      overlay: "rgba(255, 255, 255, 0.8)",
    },
  },
  {
    id: "dawn",
    name: "Dawn",
    colors: {
      background: "#fff1f2",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#334155",
      muted: "#94a3b8",
      hover: "rgba(15, 23, 42, 0.05)",
      overlay: "rgba(255, 255, 255, 0.8)",
    },
  },
  {
    id: "latte",
    name: "Latte",
    colors: {
      background: "#fdfbf7",
      surface: "#f5f0e8",
      border: "#e7e5e4",
      text: "#44403c",
      muted: "#a8a29e",
      hover: "rgba(28, 25, 23, 0.05)",
      overlay: "rgba(253, 251, 247, 0.8)",
    },
  },
] as const;

export type ThemePaletteId = (typeof THEME_PALETTES)[number]["id"];

export const getContrastColor = (hex: string) => {
  if (hex === "transparent") return "var(--color-text)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};
