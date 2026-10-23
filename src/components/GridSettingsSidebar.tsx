import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";
import { projectTypeMeta } from "@/constants/projectTypes";
import { PixelText } from "@/components/pixel/PixelText";

import { DimensionsSection } from "./settings/DimensionsSection";
import { AppearanceSection } from "./settings/AppearanceSection";
import { VisibilitySection } from "./settings/VisibilitySection";

import { motion as motionPreset } from "@/lib/motion";
import { resolveBoardStyle } from "@/utils/boardStyle";

export interface GridSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}

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
  const board = resolveBoardStyle(activeRank);

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
      },
    );
  };

  return (
    <>
      <div
        aria-hidden={!isOpen || undefined}
        className={`fixed inset-0 bg-overlay z-rail-panel md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        inert={!isOpen || undefined}
        aria-label="Project settings"
        className={`
          shrink-0 overflow-hidden
          z-rail-panel
          fixed top-14 bottom-0 left-0 md:static md:top-auto
          rounded-r-panel md:rounded-none
          transition-[width,opacity] duration-240 ease-emphasized
          ${isOpen ? "rail-elevation" : ""}
        `}
        style={{
          width: isOpen ? "min(var(--rail-width), 86vw)" : "0rem",
          opacity: isOpen ? 1 : 0,
          backgroundColor: "var(--color-rail)",
          borderRight: isOpen
            ? "0.5px solid var(--material-hairline)"
            : "0.5px solid transparent",
          pointerEvents: isOpen ? undefined : "none",
        }}
      >
        <div className="w-full max-w-80 h-full flex flex-col">
          <div className="flex items-center gap-3 px-5 h-14 shrink-0 border-b border-hairline bg-[var(--color-rail)]">
            <span
              className="grid place-items-center w-9 h-9 rounded-[10px] squircle shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, ${meta.tint} 18%, transparent)`,
                color: meta.tint,
              }}
            >
              <TypeIcon size={18} strokeWidth={2} />
            </span>

            <span className="flex flex-col min-w-0 flex-1">
              <span
                className="text-caption-2 font-semibold text-muted"
                style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                {meta.longLabel}
              </span>
              <span className="block min-w-0 overflow-hidden mt-0.5">
                <PixelText
                  text={activeRank.title}
                  height={14}
                  className="text-text shrink-0"
                />
              </span>
            </span>

            <button
              type="button"
              onClick={handleClearAll}
              aria-label={
                projectType === "tierlist" ? "Clear all tiers" : "Clear board"
              }
              title={
                projectType === "tierlist" ? "Clear all tiers" : "Clear board"
              }
              className="grid place-items-center w-8 h-8 shrink-0 rounded-full
                         text-muted hover:text-destructive hover:bg-destructive/10
                         transition-colors touch-target"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <motion.div
            className="flex-1 overflow-y-auto scrollbar-ios overflow-x-hidden overscroll-contain"
            initial={false}
            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={motionPreset.sheet}
          >
            <div className="flex flex-col gap-6 py-5 pb-6">
              <DimensionsSection
                projectType={projectType}
                config={config}
                cellWidth={activeRank.cellWidth}
                tierRowHeight={board.tierRowHeight}
                onRowsChange={handleRowsChange}
                onColsChange={handleColsChange}
                onCellWidthChange={(v) => updateActiveRank({ cellWidth: v })}
                onTierRowHeightChange={(v) =>
                  updateActiveRank({ tierRowHeight: v })
                }
              />

              <AppearanceSection
                projectType={projectType}
                aspectRatio={board.aspectRatio}
                style={style as "card" | "seamless"}
                borderless={board.borderless}
                gap={board.gap}
                borderRadius={board.radius}
                gridJustify={board.justify}
                tierSpacing={board.tierSpacing}
                rankBackgroundColor={activeRank.backgroundColor}
                onUpdateRank={updateActiveRank}
              />

              <VisibilitySection
                projectType={projectType}
                showNumbers={board.showNumbers}
                showTitle={board.showTitle}
                showDate={board.showDate}
                showWatermark={board.showWatermark}
                onVisualToggle={handleVisualToggle}
              />
            </div>
          </motion.div>

          <div
            aria-hidden
            className="shrink-0"
            style={{ height: "env(safe-area-inset-bottom)" }}
          />
        </div>
      </aside>
    </>
  );
};
