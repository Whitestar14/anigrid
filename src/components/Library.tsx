import React, { useState } from 'react';
import { Rank, ProjectType } from '@/types';
import { Trash2, Edit2, LayoutGrid, Layers, ChevronRight, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { SettingRow } from '@/components/ui/SettingCard';

interface LibraryProps {
  isOpen: boolean;
  onClose: () => void;
  ranks: Rank[];
  activeRankId: string;
  onSelectRank: (id: string) => void;
  onDeleteRank: (id: string) => void;
  onNewRank: (type: ProjectType) => void;
}

interface ExtendedLibraryProps extends LibraryProps {
  onUpdateRank?: (id: string, updates: Partial<Rank>) => void;
}

export const Library: React.FC<ExtendedLibraryProps> = ({
  isOpen,
  onClose,
  ranks,
  activeRankId,
  onSelectRank,
  onDeleteRank,
  onNewRank,
  onUpdateRank
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Sort by updated recently
  const sortedRanks = [...ranks].sort((a, b) => b.updatedAt - a.updatedAt);

  const startEditing = (e: React.MouseEvent, rank: Rank) => {
    e.stopPropagation();
    setEditingId(rank.id);
    setEditTitle(rank.title);
  };

  const saveEditing = (id: string) => {
    if (onUpdateRank && editTitle.trim()) {
      onUpdateRank(id, { title: editTitle });
    }
    setEditingId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
      contentClassName="p-0 flex flex-col min-h-0"
    >
      {/* iOS-like Header */}
      <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-border glass-card">
        <div className="w-16"></div>
        <h2 className="text-lg font-semibold text-text tracking-tight">Projects</h2>
        <button
          onClick={onClose}
          className="w-16 text-right text-primary hover:opacity-70 font-medium text-[15px] transition-opacity"
        >
          Done
        </button>
      </div>

      <div className="px-4 pt-5 pb-3 shrink-0 flex gap-3">
        <button
          onClick={() => { onNewRank('ranking'); onClose(); }}
          className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[20px] glass-card hover:bg-hover transition-colors text-text text-[13px] font-medium shadow-sm"
        >
          <LayoutGrid size={22} className="text-primary" />
          New Grid
        </button>
        <button
          onClick={() => { onNewRank('tierlist'); onClose(); }}
          className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[20px] glass-card hover:bg-hover transition-colors text-text text-[13px] font-medium shadow-sm"
        >
          <Layers size={22} className="text-purple-400" />
          New Tier List
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        <h3 className="text-[13px] font-medium text-muted uppercase tracking-wide mb-2 ml-4">Recent Projects</h3>

        {sortedRanks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <LayoutGrid size={40} strokeWidth={1} className="mb-3 opacity-50" />
            <span className="text-[15px]">No projects yet</span>
          </div>
        ) : (
          <div className="glass-card rounded-[20px] overflow-hidden flex flex-col">
            <AnimatePresence mode="popLayout">
              {sortedRanks.map((rank, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={rank.id}
                >
                  <SettingRow
                    as="div"
                    onClick={() => {
                      if (editingId !== rank.id) {
                        onSelectRank(rank.id);
                        onClose();
                      }
                    }}
                    icon={rank.type === 'tierlist' ? <Layers size={16} strokeWidth={2} /> : <LayoutGrid size={16} strokeWidth={2} />}
                    iconBg={rank.type === 'tierlist' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'}
                    label={
                      <div className="flex items-center gap-2">
                        {editingId === rank.id ? (
                          <Input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveEditing(rank.id)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditing(rank.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 py-0.5 text-[15px] font-medium bg-surface-secondary border-border"
                          />
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className={`truncate ${rank.id === activeRankId ? 'text-primary' : 'text-text'}`}>
                              {rank.title}
                            </h4>
                            <button
                              onClick={(e) => startEditing(e, rank)}
                              className="p-1 text-muted hover:text-text transition-all hover:bg-hover rounded"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    }
                    sublabel={
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{rank.type === 'tierlist' ? 'Tier List' : 'Ranking Grid'}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{new Date(rank.updatedAt).toLocaleDateString()}</span>
                      </div>
                    }
                    right={
                      <>
                        {rank.id === activeRankId && (
                          <Check size={16} className="text-primary mr-1" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRank(rank.id);
                          }}
                          className={`p-2 rounded-lg transition-all ${ranks.length === 1 ? 'text-muted cursor-not-allowed' : 'text-muted hover:text-red-400 hover:bg-red-500/10'}`}
                          disabled={ranks.length === 1}
                          title={ranks.length === 1 ? "Cannot delete the only project" : "Delete Project"}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                        <div className="text-muted group-hover:text-text transition-colors ml-1">
                          <ChevronRight size={16} strokeWidth={2} />
                        </div>
                      </>
                    }
                    className={rank.id === activeRankId ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-hover'}
                  />
                  {index !== sortedRanks.length - 1 && (
                    <div className="h-[0.5px] bg-border shrink-0" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Modal >
  );
};

