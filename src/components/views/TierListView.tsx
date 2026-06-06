import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { TierRow } from "@/types";
import { Plus, ChevronUp, ChevronDown, Settings } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { useStore } from "@/store/useStore";
import { selectActiveRank } from "@/store/selectors";
import { TierItem, TierRowWrapper } from '@/components/TierItem';

export const TierListView: React.FC = () => {
  const rank = useStore(selectActiveRank);
  const handleUpdateTierRows = useStore(s => s.handleUpdateTierRows);

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  if (!rank) return null;

  const handleUpdateRow = (rowId: string, updates: Partial<TierRow>) => {
    const newRows = rank.tierRows.map((r) => r.id === rowId ? { ...r, ...updates } : r);
    handleUpdateTierRows(newRows);
  };

  const handleMoveRow = (index: number, direction: "up" | "down") => {
    const newRows = [...rank.tierRows];
    if (direction === "up" && index > 0) [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]];
    else if (direction === "down" && index < newRows.length - 1) [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
    handleUpdateTierRows(newRows);
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rank.tierRows.filter((_, i) => i !== index);
    handleUpdateTierRows(newRows);
  };

  const handleAddRow = () => {
    const newRow: TierRow = { id: `tier-${Date.now()}`, label: "NEW", color: "#334155", items: [] };
    handleUpdateTierRows([...rank.tierRows, newRow]);
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-20 border-b border-border">
      {rank.tierRows.map((row, rowIndex) => (
        <div key={row.id} className="flex min-h-[6rem] border-t border-border bg-surface">
          <div className="w-24 sm:w-32 flex items-center justify-center p-2 shrink-0 relative border-r border-border cursor-text group/label" style={{ backgroundColor: row.color }} onClick={() => setEditingLabelId(row.id)}>
            {editingLabelId === row.id ? (
              <textarea autoFocus value={row.label} onChange={(e) => handleUpdateRow(row.id, { label: e.target.value })} onBlur={() => setEditingLabelId(null)} className="w-full h-full bg-transparent text-center text-text font-black text-xl resize-none outline-none overflow-hidden" />
            ) : (
              <span className="text-center text-text font-black text-xl break-words leading-tight w-full select-none">{row.label}</span>
            )}
          </div>
          <TierRowWrapper 
            rowId={row.id} 
            justify={rank.gridJustify}
          >
            <AnimatePresence>
              {row.items.map((item, idx) => (
                <TierItem key={item.id} rowId={row.id} idx={idx} item={item} aspectRatio={rank.aspectRatio || "3:4"} />
              ))}
            </AnimatePresence>
            {row.items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-muted text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-border px-4 py-2 rounded-xl">
                  Drop here
                </span>
              </div>
            )}
          </TierRowWrapper>
          <div className="w-10 sm:w-16 bg-surface shrink-0 flex flex-col items-center justify-between py-1 border-l border-border">
            <Select value="" onChange={(val) => { if (val === 'clear') handleUpdateRow(row.id, { items: [] }); if (val === 'delete') handleDeleteRow(rowIndex); }} options={[{ label: "Clear Images", value: "clear" }, { label: "Delete Row", value: "delete" }]} customTrigger={
              <button className="w-8 h-8 flex items-center justify-center text-muted hover:text-text hover:bg-hover rounded-full transition-colors mt-1">
                <Settings size={18} />
              </button>
            } alignOffset="right" dropdownClassName="w-48" />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleMoveRow(rowIndex, "up")} disabled={rowIndex === 0} className="p-1 text-muted hover:text-text disabled:opacity-30"><ChevronUp size={18} /></button>
              <button onClick={() => handleMoveRow(rowIndex, "down")} disabled={rowIndex === rank.tierRows.length - 1} className="p-1 text-muted hover:text-text disabled:opacity-30"><ChevronDown size={18} /></button>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddRow}
        className="w-full flex min-h-[4rem] items-center justify-center gap-3 bg-surface hover:bg-hover text-muted hover:text-text border-t border-border transition-all group/add-row"
      >
        <Plus size={24} className="group-hover/add-row:scale-110 transition-transform" />
        <span className="text-sm font-black uppercase tracking-[0.2em]">Add New Tier</span>
      </button>
    </div>
  );
};
