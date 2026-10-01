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

    // Saved state can name a palette that no longer exists.
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
  }, [theme, isLoaded]);

  useLayoutEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-glass",
      reduceGlassEffects
    );
  }, [reduceGlassEffects]);
}
