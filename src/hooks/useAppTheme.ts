import { useLayoutEffect } from "react";
import { useStore } from "@/store/useStore";
import { selectTheme, selectPreferences } from "@/store/selectors";
import { THEME_PALETTES } from "@/theme/palettes";

export function useAppTheme(isLoaded: boolean) {
  const theme = useStore(selectTheme);
  const preferences = useStore(selectPreferences);
  const reduceGlassEffects = preferences.reduceGlassEffects ?? false;

  useLayoutEffect(() => {
    if (isLoaded && theme) {
      const root = document.documentElement;

      const isDark = theme.isDark ?? true;
      if (isDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }

      root.style.setProperty("--color-primary", theme.accentColor);
      const paletteId = theme.paletteId || (isDark ? "ios-dark" : "ios-light");
      const palette = THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];

      root.style.setProperty("--color-background", palette.colors.background);
      root.style.setProperty("--color-surface", palette.colors.surface);
      root.style.setProperty("--color-border", palette.colors.border);
      root.style.setProperty("--color-text", palette.colors.text);
      root.style.setProperty("--color-muted", palette.colors.muted);
      root.style.setProperty("--color-hover", palette.colors.hover);
      root.style.setProperty("--color-overlay", palette.colors.overlay);
    }
  }, [theme, isLoaded]);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-reduce-glass", reduceGlassEffects);
  }, [reduceGlassEffects]);
}
