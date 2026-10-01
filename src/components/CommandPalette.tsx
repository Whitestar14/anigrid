import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  LayoutGrid,
  List,
  Layers,
  Settings2,
  Sun,
  Moon,
  Droplet,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Keyboard,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useCommandState } from "@/state/commandState";
import { selectTheme, selectPreferences } from "@/store/selectors";

export interface PaletteCommand {
  id: string;
  label: string;
  /** Grouping label, shown when nothing is typed. */
  section: "Projects" | "Create" | "Actions";
  keywords?: string;
  icon: React.ElementType;
  run: () => void;
}

export const CommandPalette: React.FC<{ extraCommands?: PaletteCommand[] }> = ({
  extraCommands = [],
}) => {
  const isOpen = useCommandState((s) => s.isOpen);
  const close = useCommandState((s) => s.close);

  const ranks = useStore((s) => s.ranks);
  const activeRankId = useStore((s) => s.activeRankId);
  const setActiveRankId = useStore((s) => s.setActiveRankId);
  const handleNewRank = useStore((s) => s.handleNewRank);
  const updatePreferences = useStore((s) => s.updatePreferences);
  const updateGlobalTheme = useStore((s) => s.updateGlobalTheme);
  const theme = useStore(selectTheme);
  const preferences = useStore(selectPreferences);

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = theme?.isDark ?? true;
  const reduceGlass = preferences.reduceGlassEffects ?? false;

  const commands = useMemo<PaletteCommand[]>(() => {
    const projectCommands: PaletteCommand[] = Object.values(ranks).map(
      (rank) => ({
        id: `goto-${rank.id}`,
        label: rank.title,
        section: "Projects",
        keywords: `${rank.type} switch open project`,
        icon:
          rank.type === "tierlist" ? Layers : rank.type === "list" ? List : LayoutGrid,
        run: () => setActiveRankId(rank.id),
      })
    );

    return [
      ...projectCommands,
      {
        id: "new-grid",
        label: "New ranking grid",
        section: "Create",
        keywords: "add project board ranking",
        icon: LayoutGrid,
        run: () => handleNewRank("ranking"),
      },
      {
        id: "new-list",
        label: "New list",
        section: "Create",
        keywords: "add project ranked list",
        icon: List,
        run: () => handleNewRank("list"),
      },
      {
        id: "new-tiers",
        label: "New tier list",
        section: "Create",
        keywords: "add project tiers rows",
        icon: Layers,
        run: () => handleNewRank("tierlist"),
      },
      {
        id: "theme",
        label: isDark ? "Switch to light appearance" : "Switch to dark appearance",
        section: "Actions",
        keywords: "theme dark light mode appearance",
        icon: isDark ? Sun : Moon,
        run: () => updateGlobalTheme({ isDark: !isDark }),
      },
      {
        id: "glass",
        label: reduceGlass ? "Turn glass effects on" : "Reduce glass effects",
        section: "Actions",
        keywords: "transparency blur material performance",
        icon: Droplet,
        run: () => updatePreferences({ reduceGlassEffects: !reduceGlass }),
      },
      {
        id: "shortcuts",
        label: "Keyboard shortcuts",
        section: "Actions",
        keywords: "keys help cheat sheet hotkeys",
        icon: Keyboard,
        run: () => useCommandState.getState().toggleShortcuts(),
      },
      ...extraCommands,
    ];
  }, [
    ranks,
    setActiveRankId,
    handleNewRank,
    isDark,
    updateGlobalTheme,
    reduceGlass,
    updatePreferences,
    extraCommands,
  ]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""} ${c.section}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Reset on open so the palette always starts clean.
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setCursor(0);
      // Focus after paint: the input is inside an animated panel.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)));
  }, [results.length]);

  // Keep the highlighted row in view as the cursor moves.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const runCommand = useCallback(
    (command: PaletteCommand) => {
      close();
      // Let the palette unmount before the command mutates the app, so a command
      // that opens another sheet is not fighting this one for focus.
      requestAnimationFrame(() => command.run());
    },
    [close]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) =>
        results.length ? (c - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = results[cursor];
      if (command) runCommand(command);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  let lastSection: string | null = null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.7 }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-lg material-thick squircle rounded-panel
                       overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-hairline">
              <Search size={17} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects and actions"
                aria-label="Search projects and actions"
                className="flex-1 min-w-0 bg-transparent text-callout text-text
                           placeholder:text-faint outline-none"
              />
              <kbd className="hidden sm:block shrink-0 text-caption-2 font-medium text-faint
                              px-1.5 py-0.5 rounded-hairline border border-hairline">
                esc
              </kbd>
            </div>

            <div
              ref={listRef}
              className="overflow-y-auto scrollbar-ios py-1.5"
              role="listbox"
            >
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-footnote text-muted">
                  Nothing matches “{query}”
                </p>
              ) : (
                results.map((command, i) => {
                  const heading =
                    command.section !== lastSection ? command.section : null;
                  lastSection = command.section;
                  const Icon = command.icon;
                  const isActive = i === cursor;

                  return (
                    <React.Fragment key={command.id}>
                      {heading && (
                        <div className="px-4 pt-3 pb-1 text-caption-2 font-semibold uppercase tracking-[0.06em] text-faint">
                          {heading}
                        </div>
                      )}
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-index={i}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => runCommand(command)}
                        className={`w-[calc(100%-0.75rem)] mx-1.5 flex items-center gap-3 px-3 py-2.5
                                    rounded-control text-left transition-colors duration-100
                                    ${isActive ? "bg-hover" : ""}`}
                      >
                        <span
                          className={`grid place-items-center w-7 h-7 rounded-chip squircle shrink-0
                                      transition-colors duration-100 ${
                                        isActive ? "text-primary" : "text-muted"
                                      }`}
                          style={{
                            backgroundColor: isActive
                              ? "color-mix(in srgb, var(--color-primary) 16%, transparent)"
                              : "var(--color-surface-secondary)",
                          }}
                        >
                          <Icon size={15} strokeWidth={2.2} />
                        </span>
                        <span className="flex-1 min-w-0 truncate text-subheadline text-text">
                          {command.label}
                        </span>
                        {command.id === `goto-${activeRankId}` && (
                          <span className="shrink-0 text-caption-1 text-faint">
                            Current
                          </span>
                        )}
                        {isActive && (
                          <CornerDownLeft
                            size={14}
                            className="shrink-0 text-faint"
                            aria-hidden
                          />
                        )}
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer hints: the palette teaches its own keystrokes. */}
            <div className="hidden sm:flex items-center gap-4 px-4 h-9 shrink-0 border-t border-hairline text-caption-1 text-faint">
              <span className="flex items-center gap-1">
                <ArrowUp size={11} />
                <ArrowDown size={11} />
                navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft size={11} />
                run
              </span>
              <span className="ml-auto flex items-center gap-1">
                <Settings2 size={11} />
                ⌘K anywhere
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
