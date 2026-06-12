import React from "react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";

import { ProjectHeaderSection } from "./settings/ProjectHeaderSection";
import { ViewModeSection } from "./settings/ViewModeSection";
import { DimensionsSection } from "./settings/DimensionsSection";
import { AppearanceSection } from "./settings/AppearanceSection";
import { VisibilitySection } from "./settings/VisibilitySection";

export interface GridSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  requestConfirm: (title: string, message: string, action: () => void) => void;
}

export const GridSettingsSidebar: React.FC<GridSettingsSidebarProps> = ({
  isOpen,
  onClose,
  requestConfirm,
}) => {
  const activeRank = useStore(useShallow((s) => s.ranks[s.activeRankId]));
  const handleConfigChange = useStore((s) => s.handleConfigChange);
  const handleModeChange = useStore((s) => s.handleModeChange);
  const handleVisualToggle = useStore((s) => s.handleVisualToggle);
  const updateActiveRank = useStore((s) => s.updateActiveRank);

  if (!activeRank) return null;

  const { config, style, mode, type: projectType } = activeRank;
  const showNumbers = activeRank.showNumbers ?? true;
  const showTitle = activeRank.showTitle ?? true;
  const showDate = activeRank.showDate ?? true;
  const borderless = activeRank.borderless ?? false;
  const gap = activeRank.gap ?? 0;
  const gridJustify = activeRank.gridJustify;
  const cellWidth = activeRank.cellWidth;
  const rankBackgroundColor = activeRank.backgroundColor;
  const aspectRatio = activeRank.aspectRatio || "3:4";

  const handleRowsChange = (val: number) => {
    const r = Math.max(1, Math.min(50, val));
    handleConfigChange({ ...config, rows: r });
  };

  const handleColsChange = (val: number) => {
    const c = Math.max(1, Math.min(20, val));
    handleConfigChange({ ...config, cols: c });
  };

  const handleClearAll = () => {
    requestConfirm("Clear All?", "All content will be removed.", () => {
      useStore.getState().handleClearAll();
    });
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <aside
        className={`
           glass border-r border-border border-l-0 border-y-0 flex shrink-0 z-40
           fixed top-14 bottom-0 left-0 md:static overflow-hidden
         `}
        style={{
          width: isOpen ? "20rem" : "0",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: [
            "width 200ms cubic-bezier(0.32,0.72,0,1)",
            "transform 200ms cubic-bezier(0.32,0.72,0,1)",
            "opacity 200ms ease",
          ].join(", "),
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="relative w-80 h-full">
          <div
            className={`
              absolute inset-y-0 left-0 w-80 flex flex-col overflow-y-auto custom-scrollbar overflow-x-hidden
              transition-opacity duration-200
              ${isOpen ? "opacity-100 delay-150" : "opacity-0 pointer-events-none"}
            `}
          >
            <div className="flex flex-col gap-8 pt-6 pb-24 w-80">
              <ProjectHeaderSection
                projectType={projectType}
                onClearAll={handleClearAll}
                onClose={onClose}
              />

              {projectType === "ranking" && (
                <ViewModeSection mode={mode} onModeChange={handleModeChange} />
              )}

              <div className="h-px bg-border mx-4"></div>

              {projectType === "ranking" && (
                <DimensionsSection
                  mode={mode}
                  config={config}
                  cellWidth={cellWidth}
                  onRowsChange={handleRowsChange}
                  onColsChange={handleColsChange}
                  onCellWidthChange={(v) => updateActiveRank({ cellWidth: v || undefined })}
                />
              )}

              <AppearanceSection
                projectType={projectType}
                mode={mode}
                aspectRatio={aspectRatio}
                style={style as "card" | "seamless"}
                borderless={borderless}
                gap={gap}
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
          </div>
        </div>
      </aside>
    </>
  );
};
