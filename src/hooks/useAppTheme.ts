import { useLayoutEffect } from "react";
import { useStore } from "@/store/useStore";
import { selectTheme, selectPreferences } from "@/store/selectors";
import { isKnownPalette, accentForeground } from "@/theme/palettes";

/** Applies the active appearance and accent to `<html>`. */
export function useAppTheme(isLoaded: boolean) {
  const theme = useStore(selectTheme);
  const preferences = useStore(selectPreferences);
  const reduceGlassEffects = preferences.reduceGlassEffects ?? false;

  useLayoutEffect(() => {
    if (!isLoaded || !theme) return;
    const root = document.documentElement;

    const isDark = theme.isDark ?? true;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);

    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
    }

    const paletteId = isKnownPalette(theme.paletteId)
      ? theme.paletteId
      : isDark
        ? "ios-dark"
        : "ios-light";
    root.dataset.theme = paletteId;

    root.style.setProperty("--color-primary", theme.accentColor);
    root.style.setProperty(
      "--color-on-accent",
      accentForeground(theme.accentColor)
    );

    const meta = document.querySelector('meta[name="theme-color"]');
    const pageColor = getComputedStyle(root)
      .getPropertyValue("--color-background")
      .trim();
    if (meta && pageColor) meta.setAttribute("content", pageColor);
  }, [theme, isLoaded]);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-glass",
      reduceGlassEffects
    );
  }, [reduceGlassEffects]);
}
