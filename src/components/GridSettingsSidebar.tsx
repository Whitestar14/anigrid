import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";
import { projectTypeMeta } from "@/constants/projectTypes";

import { DimensionsSection } from "./settings/DimensionsSection";
import { AppearanceSection } from "./settings/AppearanceSection";
import { VisibilitySection } from "./settings/VisibilitySection";
import { Button } from "./ui/Button";
import { motion as motionPreset } from "@/lib/motion";

export interface GridSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}

/**
 * The project settings rail. Glass-surfaced, on its own z step above the dock,
 * with a prominent identity header and a pinned footer for destructive actions.
 */
export const GridSettingsSidebar: React.FC<GridSettingsSidebarProps> = ({
  isOpen,
  onClose,
  requestConfirm,
}) => {
  const activeRank = useStore(useShallow((s) => s.ranks[s.activeRankId]));
  const handleConfigChange = useStore((s) => s.handleConfigChange);
  const handleVisualToggle = useStore((s) => s.handleVisualToggle);
  const updateActiveRank = useStore((s) => s.updateActiveRank);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-sidebar-open", isOpen);
    return () => {
      document.documentElement.removeAttribute("data-sidebar-open");
    };
  }, [isOpen]);

  if (!activeRank) return null;

  const { config, style, type: projectType } = activeRank;
  const showNumbers = activeRank.showNumbers ?? true;
  const showTitle = activeRank.showTitle ?? true;
  const showDate = activeRank.showDate ?? true;
  const borderless = activeRank.borderless ?? false;
  const gap = activeRank.gap ?? 0;
  const gridJustify = activeRank.gridJustify;
  const cellWidth = activeRank.cellWidth;
  const borderRadius = activeRank.borderRadius;
  const rankBackgroundColor = activeRank.backgroundColor;
  const aspectRatio = activeRank.aspectRatio || "3:4";

  const meta = projectTypeMeta(projectType);
  const TypeIcon = meta.icon;

  const handleRowsChange = (val: number) =>
    handleConfigChange({ ...config, rows: Math.max(1, Math.min(50, val)) });
  const handleColsChange = (val: number) =>
    handleConfigChange({ ...config, cols: Math.max(1, Math.min(20, val)) });

  const handleClearAll = () => {
    requestConfirm(
      "Clear this board?",
      "Every image on it goes back to the Library. Nothing is deleted permanently.",
      () => {
        useStore.getState().handleClearAll();
      }
    );
  };

  return (
    <>
      {/* Scrim: mobile only */}
      <div
        aria-hidden={!isOpen || undefined}
        className={`fixed inset-0 bg-overlay z-rail-panel md:hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      <aside
        inert={!isOpen || undefined}
        aria-label="Project settings"
        className="
          shrink-0 overflow-hidden
          border-r border-hairline
          z-rail-panel
          fixed top-14 bottom-0 left-0 md:static md:top-auto
          rounded-r-panel md:rounded-none
          shadow-[var(--material-shadow-high)] md:shadow-none
          transition-[width,opacity] duration-240 ease-emphasized
        "
        style={{
          width: isOpen ? "var(--rail-width)" : "0rem",
          opacity: isOpen ? 1 : 0,
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div className="w-80 h-full flex flex-col">
          {/* Identity, not a control. On `surface` so it reads as the rail's own
              app bar rather than as the first row of the list. */}
          <div className="flex items-center gap-3 px-5 h-14 shrink-0 border-b border-hairline bg-surface">
            <span
              className="grid place-items-center w-9 h-9 rounded-[10px] squircle shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, ${meta.tint} 18%, transparent)`,
                color: meta.tint,
              }}
            >
              <TypeIcon size={18} strokeWidth={2} />
            </span>

            {/* Text — type caption above, board title below */}
            <span className="flex flex-col min-w-0 flex-1">
              <span
                className="text-caption-2 font-semibold text-muted"
                style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                {meta.longLabel}
              </span>
              <span className="text-subheadline font-semibold text-text truncate mt-0.5 leading-snug">
                {activeRank.title}
              </span>
            </span>
          </div>

          {/* ── Scrollable content ───────────────────────────────────────── */}
          <motion.div
            className="flex-1 overflow-y-auto scrollbar-ios overflow-x-hidden overscroll-contain"
            initial={false}
            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={motionPreset.sheet}
          >
            <div className="flex flex-col gap-6 py-5 pb-6">
              {/* A grid and a list both size themselves from `config.rows`; a
                  tier list is measured in tiers, which it adds and removes
                  inline, so it gets neither. */}
              {(projectType === "ranking" || projectType === "list") && (
                <DimensionsSection
                  projectType={projectType}
                  config={config}
                  cellWidth={cellWidth}
                  onRowsChange={handleRowsChange}
                  onColsChange={handleColsChange}
                  onCellWidthChange={(v) => updateActiveRank({ cellWidth: v })}
                />
              )}

              <AppearanceSection
                projectType={projectType}
                aspectRatio={aspectRatio}
                style={style as "card" | "seamless"}
                borderless={borderless}
                gap={gap}
                borderRadius={borderRadius}
                gridJustify={gridJustify}
                rankBackgroundColor={rankBackgroundColor}
                onUpdateRank={updateActiveRank}
              />

              <VisibilitySection
                projectType={projectType}
                showNumbers={showNumbers}
                showTitle={showTitle}
                showDate={showDate}
                showWatermark={activeRank.showWatermark ?? true}
                onVisualToggle={handleVisualToggle as (k: string) => void}
              />
            </div>
          </motion.div>

          {/* ── Footer — destructive action, always reachable ─────────────
              Elevated one step above the rail body so it reads as a
              pinned chrome zone rather than just the bottom list item. */}
          <div
            className="shrink-0 border-t border-hairline px-4 py-3.5"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))",
            }}
          >
            <Button
              variant="danger"
              size="md"
              fullWidth
              icon={<Trash2 size={15} />}
              onClick={handleClearAll}
            >
              {projectType === "tierlist" ? "Clear all tiers" : "Clear board"}
            </Button>
          </div>

        </div>
      </aside>
    </>
  );
};
