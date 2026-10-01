import React from "react";
import { Slider } from "@/components/ui/Slider";

import { ProjectType } from "@/types";

interface DimensionsSectionProps {
  projectType: ProjectType;
  config: { rows: number; cols: number };
  cellWidth: number | null | undefined;
  onRowsChange: (v: number) => void;
  onColsChange: (v: number) => void;
  onCellWidthChange: (v: number) => void;
}

export const DimensionsSection: React.FC<DimensionsSectionProps> = ({
  projectType,
  config,
  cellWidth,
  onRowsChange,
  onColsChange,
  onCellWidthChange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-footnote font-medium text-muted uppercase tracking-wide pl-4">
        Dimensions
      </span>
      {projectType !== "tierlist" ? (
        <div className="mx-4 material-card rounded-card overflow-hidden divide-y divide-hairline">
          <div className={`px-4 py-3 flex items-center gap-3 ${projectType === "list" ? "justify-center" : ""}`}>
            <div className={`flex flex-col gap-0.5 items-center ${projectType === "list" ? "w-full" : "flex-1"}`}>
              <span className="text-caption-2 text-muted font-medium uppercase">Rows</span>
              <input type="number" min="1" max="50" value={config.rows} onChange={(e) => onRowsChange(parseInt(e.target.value))} className="text-center font-semibold bg-transparent text-text focus:outline-none w-full text-body" />
            </div>
            {projectType === "ranking" && (
              <>
                <span className="text-muted font-medium text-lg">×</span>
                <div className="flex-1 flex flex-col gap-0.5 items-center">
                  <span className="text-caption-2 text-muted font-medium uppercase">Cols</span>
                  <input type="number" min="1" max="20" value={config.cols} onChange={(e) => onColsChange(parseInt(e.target.value))} className="text-center font-semibold bg-transparent text-text focus:outline-none w-full text-body" />
                </div>
              </>
            )}
          </div>
          <div className="px-4 py-3 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-caption-2 text-muted font-medium uppercase">
              <span>Cell Width</span>
              <span>{cellWidth || 'Auto'}</span>
            </div>
            <Slider min={60} max={300} step={5} value={cellWidth || 60} onChange={(v) => onCellWidthChange(v || 60)} />
            <div className="flex justify-between text-caption-2 text-muted">
              <span>Narrow</span><span>Wide</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-4 material-card rounded-card overflow-hidden">
          <div className="px-4 py-3 flex flex-col gap-0.5 items-center">
            <span className="text-caption-2 text-muted font-medium uppercase">Items</span>
            <input type="number" min="1" max="100" value={config.rows} onChange={(e) => onRowsChange(parseInt(e.target.value))} className="text-center font-semibold bg-transparent text-text focus:outline-none w-full text-body" />
          </div>
        </div>
      )}
    </div>
  );
};
