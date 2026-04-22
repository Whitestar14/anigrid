import React from "react";
import {
  Maximize2,
  Grid,
  Hash,
  Type,
  Calendar,
  List,
  LayoutGrid,
  Trash2,
  Save,
  Upload,
  Layers,
  SquareDashedKanban,
  Square,
  X,
  Palette,
} from "lucide-react";
import { ColorPicker } from '@/components/ui/ColorPicker';
import { useStore } from "@/store/useStore";
import { Slider } from "@/components/ui/Slider";
import { exportStateToJson, migrateState } from "@/utils/storage";
import { useShallow } from "zustand/react/shallow";

export interface GridSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  /** Destructive actions (clear grid) use the app-level confirm modal */
  requestConfirm: (title: string, message: string, action: () => void) => void;
}

/**
 * iOS-style grouped list card — automatically inserts inset dividers between children.
 * Each child is typically a <button> or <label> row.
 */
const SettingButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  return (
    <div className={`flex flex-col bg-[#2c2c2e] rounded-2xl mx-4 overflow-hidden ${className}`}>
      {childrenArray.map((child, idx) => (
        <React.Fragment key={idx}>
          {child}
          {idx < childrenArray.length - 1 && (
            <div className="h-px bg-[#3a3a3c] ml-[3.25rem]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/** A single row inside a SettingButtonGroup — icon + label + optional right element */
const SettingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  iconBg?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  className?: string;
}> = ({ icon, label, iconBg = "bg-primary/20 text-primary", onClick, right, destructive, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/5 transition-colors ${destructive ? "text-[#ff453a]" : "text-white"
      } ${className}`}
  >
    <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <span className="flex-1 text-[15px]">{label}</span>
    {right}
  </button>
);
const GRID_BG_COLORS = [
  "transparent",
  "#ffffff",
  "#0f1115",
  "#181b21",
  "#1a202c",
  "#2d3748",
  "#000000",
];

export const GridSettingsSidebar: React.FC<GridSettingsSidebarProps> = ({
  isOpen,
  onClose,
  requestConfirm,
}) => {
  const jsonInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleExportJson = () => exportStateToJson(useStore.getState());

  const handleImportJson = async (file: File) => {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const migrated = migrateState(json);
      if (migrated) useStore.getState().importState(migrated);
    } catch (e) {
      console.error("Failed to import JSON", e);
      alert("Invalid JSON file");
    }
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
           border-r border-border bg-surface/90 backdrop-blur-3xl shadow-2xl flex shrink-0 z-40
           fixed top-14 bottom-0 left-0 md:static overflow-hidden
         `}
        style={{
          width: isOpen ? "20rem" : "0",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: [
            "width 300ms cubic-bezier(0.32,0.72,0,1)",
            "transform 300ms cubic-bezier(0.32,0.72,0,1)",
            "opacity 200ms ease",
          ].join(", "),
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="relative w-80 h-full">
          {/* Expanded Content */}
          <div
            className={`
                    absolute inset-y-0 left-0 w-80 flex flex-col overflow-y-auto custom-scrollbar overflow-x-hidden
                    transition-opacity duration-200
                    ${isOpen ? "opacity-100 delay-150" : "opacity-0 pointer-events-none"}
                `}
          >
            <div className="flex flex-col gap-8 py-6 w-80">
              {/* Header Section: Project Type */}
              <div className="flex items-center justify-between gap-4 p-4 bg-[#2c2c2e] rounded-2xl mx-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${projectType === "tierlist" ? "bg-purple-500/20 text-purple-500" : "bg-primary/20 text-primary"}`}
                  >
                    {projectType === "tierlist" ? (
                      <Layers size={24} />
                    ) : (
                      <LayoutGrid size={24} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
                      Project Type
                    </span>
                    <span className="text-lg font-semibold text-white leading-tight tracking-tight">
                      {projectType === "tierlist"
                        ? "Tier List"
                        : "Ranking Grid"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors md:hidden"
                  title="Close Settings"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Section: Mode (Only for Ranking Type) */}
              {projectType === "ranking" && (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">
                    View Mode
                  </span>
                  <div className="flex bg-[#767680]/24 p-1 rounded-xl mx-4">
                    <button
                      onClick={() => handleModeChange("grid")}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-colors text-[13px] font-medium ${mode === "grid" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
                    >
                      <LayoutGrid size={14} /> Grid
                    </button>
                    <button
                      onClick={() => handleModeChange("list")}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-colors text-[13px] font-medium ${mode === "list" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
                    >
                      <List size={14} /> List
                    </button>
                  </div>
                </div>
              )}

              <div className="h-px bg-white/10 mx-4"></div>

              {/* Grid Specifics (Ranking Only) */}
              {projectType === "ranking" && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">
                      Dimensions
                    </span>
                    {mode === "grid" ? (
                      <div className="flex flex-col gap-3 px-4 py-3 bg-[#2c2c2e] rounded-2xl mx-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 flex flex-col gap-1">
                            <span className="text-[11px] text-white/50 font-medium uppercase">
                              Rows
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={config.rows}
                              onChange={(e) =>
                                handleRowsChange(parseInt(e.target.value))
                              }
                              className="text-center font-medium bg-transparent text-white focus:outline-none w-full"
                            />
                          </div>
                          <span className="text-white/50 font-medium">×</span>
                          <div className="flex-1 flex flex-col gap-1">
                            <span className="text-[11px] text-white/50 font-medium uppercase">
                              Cols
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={config.cols}
                              onChange={(e) =>
                                handleColsChange(parseInt(e.target.value))
                              }
                              className="text-center font-medium bg-transparent text-white focus:outline-none w-full"
                            />
                          </div>
                        </div>
                        <div className="h-px bg-white/10 w-full"></div>
                        <div className="flex flex-col gap-1 pt-1">
                          <div className="flex justify-between items-center text-[11px] text-white/50 font-medium uppercase">
                            <span>Cell Width</span>
                            <span>{cellWidth || 'Auto'}</span>
                          </div>
                          <Slider
                            min={60}
                            max={300}
                            step={5}
                            value={cellWidth || 60}
                            onChange={(v) =>
                              updateActiveRank({
                                cellWidth: v || undefined,
                              })
                            }
                          />
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span>Auto</span>
                            <span>Wide</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 px-4 py-3 bg-[#2c2c2e] rounded-2xl mx-4">
                        <span className="text-[11px] text-white/50 font-medium uppercase">
                          Items
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.rows}
                          onChange={(e) =>
                            handleRowsChange(parseInt(e.target.value))
                          }
                          className="text-center font-medium bg-transparent text-white focus:outline-none w-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-white/10 mx-4"></div>
                </>
              )}

              {/* Section: Appearance */}
              {(projectType === "ranking" || projectType === "tierlist") && (
                <>
                  <div className="flex flex-col gap-4">
                    <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">
                      Appearance
                    </span>

                    <div className="flex flex-col gap-4 px-4 py-4 bg-[#2c2c2e] rounded-[20px] mx-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
                          Aspect Ratio
                        </span>
                        <div className="grid grid-cols-5 gap-1 bg-[#1c1c1e] p-1 rounded-lg">
                          {(["1:1", "3:4", "4:3", "16:9", "9:16"] as const).map(
                            (ratio) => (
                              <button
                                key={ratio}
                                onClick={() => updateActiveRank({ aspectRatio: ratio })}
                                className={`py-1.5 text-[11px] font-medium rounded-md transition-colors ${aspectRatio === ratio || (!aspectRatio && ratio === "3:4") ? "bg-[#3a3a3c] text-white shadow-sm" : "text-white/50 hover:text-white"}`}
                              >
                                {ratio}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      {projectType === "ranking" && (
                        <>
                          <div className="h-px bg-white/5 mx-2"></div>

                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[13px] font-medium text-white/70 mb-1">
                              <span>Spacing</span>
                              <span className="text-white">{gap}px</span>
                            </div>
                            <Slider
                              min={0}
                              max={32}
                              step={2}
                              value={gap}
                              onChange={(v) =>
                                updateActiveRank({ gap: v })
                              }
                            />
                          </div>

                          <div className="h-px bg-white/10 -mx-4"></div>

                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-white/70 font-medium">
                              Grid Style
                            </span>
                            <div className="flex bg-[#767680]/24 p-1 rounded-xl">
                              <button
                                onClick={() => updateActiveRank({ style: "seamless" })}
                                title="Seamless"
                                className={`p-1.5 rounded-lg transition-colors ${style === "seamless" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
                              >
                                <Maximize2 size={16} />
                              </button>
                              <button
                                onClick={() => updateActiveRank({ style: "card" })}
                                title="Cards"
                                className={`p-1.5 rounded-lg transition-colors ${style === "card" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
                              >
                                <Grid size={16} />
                              </button>
                            </div>
                          </div>

                          {style === "seamless" && (
                            <>
                              <div className="h-px bg-white/10 -mx-4"></div>
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] text-white/70 font-medium">
                                  Borders
                                </span>
                                <div className="flex bg-[#767680]/24 p-1 rounded-xl">
                                  <button
                                    onClick={() => updateActiveRank({ borderless: false })}
                                    title="Show Borders"
                                    className={`p-1.5 rounded-lg transition-colors ${!borderless ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
                                  >
                                    <SquareDashedKanban size={16} />
                                  </button>
                                  <button
                                    onClick={() => updateActiveRank({ borderless: true })}
                                    title="Borderless"
                                    className={`p-1.5 rounded-lg transition-colors ${borderless ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
                                  >
                                    <Square size={16} />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="h-px bg-white/10 -mx-4"></div>
                        </>
                      )}

                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
                          Background
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {GRID_BG_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => updateActiveRank({ backgroundColor: color })}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${rankBackgroundColor === color ? "border-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "border-white/20 hover:border-white/50"}`}
                              style={{
                                backgroundColor:
                                  color === "transparent" ? "#000" : color,
                                backgroundImage:
                                  color === "transparent"
                                    ? "repeating-conic-gradient(#333 0% 25%, #222 0% 50%)"
                                    : "",
                              }}
                              title={
                                color === "transparent" ? "Transparent" : color
                              }
                            />
                          ))}
                          <label
                            className={`relative w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${!GRID_BG_COLORS.includes(rankBackgroundColor)
                                ? "border-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                : "border-white/20 hover:border-white/50"
                              }`}
                            style={{
                              backgroundColor: !GRID_BG_COLORS.includes(
                                rankBackgroundColor,
                              )
                                ? rankBackgroundColor
                                : "#2c2c2e",
                            }}
                            title="Custom Color"
                          >
                            <Palette
                              size={12}
                              className="text-white mix-blend-difference"
                            />
                            <ColorPicker
                              value={
                                !GRID_BG_COLORS.includes(rankBackgroundColor)
                                  ? rankBackgroundColor
                                  : "#000000"
                              }
                              onChange={(v) =>
                                updateActiveRank({ backgroundColor: v })
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-white/10 mx-4"></div>
                </>
              )}

              {/* Section: Visibility (Global) */}
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">
                  Visibility
                </span>
                <div className="grid grid-cols-3 gap-2 px-4">
                  {projectType === "ranking" && (
                    <button
                      onClick={() => handleVisualToggle("showNumbers")}
                      className={`flex flex-col items-center justify-center h-auto py-3 gap-1.5 rounded-xl transition-colors text-[13px] font-medium ${showNumbers ? "bg-primary/20 text-primary" : "bg-[#2c2c2e] text-white/70 hover:bg-[#3a3a3c] hover:text-white"}`}
                    >
                      <Hash size={16} /> Rank
                    </button>
                  )}
                  <button
                    onClick={() => handleVisualToggle("showTitle")}
                    className={`flex flex-col items-center justify-center h-auto py-3 gap-1.5 rounded-xl transition-colors text-[13px] font-medium ${showTitle ? "bg-primary/20 text-primary" : "bg-[#2c2c2e] text-white/70 hover:bg-[#3a3a3c] hover:text-white"}`}
                  >
                    <Type size={16} /> Title
                  </button>
                  <button
                    onClick={() => handleVisualToggle("showDate")}
                    className={`flex flex-col items-center justify-center h-auto py-3 gap-1.5 rounded-xl transition-colors text-[13px] font-medium ${showDate ? "bg-primary/20 text-primary" : "bg-[#2c2c2e] text-white/70 hover:bg-[#3a3a3c] hover:text-white"}`}
                  >
                    <Calendar size={16} /> Date
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/10 mx-4"></div>

              <div className="flex flex-col gap-2 relative">
                <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">
                  Data Actions
                </span>

                <SettingButtonGroup>
                  <SettingRow
                    icon={<Save size={16} />}
                    label="Backup"
                    iconBg="bg-primary/20 text-primary"
                    onClick={handleExportJson}
                  />
                  <SettingRow
                    icon={<Upload size={16} />}
                    label="Restore"
                    iconBg="bg-primary/20 text-primary"
                    onClick={() => jsonInputRef.current?.click()}
                  />
                  <SettingRow
                    icon={<Trash2 size={16} />}
                    label={`Clear ${projectType === "tierlist" ? "Tiers" : "Grid"}`}
                    iconBg="bg-red-500/20 text-[#ff453a]"
                    onClick={handleClearAll}
                    destructive
                  />
                </SettingButtonGroup>
                <input
                  type="file"
                  ref={jsonInputRef}
                  className="hidden"
                  accept="application/json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImportJson(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />

                <div className="h-10"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
