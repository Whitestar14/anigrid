import React, { useState } from 'react';
import { Rank, ProjectType } from '@/types';
import { Trash2, Edit2, LayoutGrid, Layers, ChevronRight, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';

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
      className="max-w-2xl bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
      contentClassName="p-0 flex flex-col min-h-0"
    >
        {/* iOS-like Header */}
        <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-white/10 bg-white/5">
          <div className="w-16"></div> {/* Spacer for centering */}
          <h2 className="text-lg font-semibold text-white tracking-tight">Projects</h2>
          <button
            onClick={onClose}
            className="w-16 text-right text-blue-500 hover:text-blue-400 font-medium text-[15px] transition-colors"
          >
            Done
          </button>
        </div>

        {/* New Project Actions */}
        <div className="px-6 pt-6 pb-4 shrink-0 flex gap-3">
            <button
                onClick={() => {
                    onNewRank('ranking');
                    onClose();
                }}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white text-[13px] font-medium"
            >
                <LayoutGrid size={24} className="text-blue-400" />
                New Grid
            </button>
            <button
                onClick={() => {
                    onNewRank('tierlist');
                    onClose();
                }}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white text-[13px] font-medium"
            >
                <Layers size={24} className="text-purple-400" />
                New Tier List
            </button>
        </div>

        {/* Project List (Inset Grouped style) */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
          <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-2 ml-4">Recent Projects</h3>

          {sortedRanks.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <LayoutGrid size={40} strokeWidth={1} className="mb-3 opacity-50" />
                <span className="text-[15px]">No projects found</span>
             </div>
          ) : (
             <div className="bg-[#1c1c1e] rounded-[20px] overflow-hidden border border-white/10">
               <AnimatePresence mode="popLayout">
                 {sortedRanks.map((rank, index) => (
                   <motion.div
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.2 }}
                     key={rank.id}
                     onClick={() => {
                          if (editingId !== rank.id) {
                              onSelectRank(rank.id);
                              onClose();
                          }
                      }}
                     className={`
                       group relative flex items-center justify-between p-3 transition-all cursor-pointer
                       ${index !== sortedRanks.length - 1 ? 'border-b border-white/10' : ''}
                       ${rank.id === activeRankId ? 'bg-blue-500/10' : 'hover:bg-white/5'}
                     `}
                   >
                     <div className="flex-1 min-w-0 flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${rank.type === 'tierlist' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                           {rank.type === 'tierlist' ? <Layers size={16} strokeWidth={2} /> : <LayoutGrid size={16} strokeWidth={2} />}
                       </div>

                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                           {editingId === rank.id ? (
                               <Input
                                   autoFocus
                                   value={editTitle}
                                   onChange={(e) => setEditTitle(e.target.value)}
                                   onBlur={() => saveEditing(rank.id)}
                                   onKeyDown={(e) => e.key === 'Enter' && saveEditing(rank.id)}
                                   onClick={(e) => e.stopPropagation()}
                                   className="h-7 py-0.5 text-[15px] font-medium bg-black/40 border-white/20"
                               />
                           ) : (
                               <div className="flex items-center gap-2 min-w-0">
                                   <h4 className={`text-[15px] font-medium truncate ${rank.id === activeRankId ? 'text-blue-400' : 'text-white'}`}>
                                       {rank.title}
                                   </h4>
                                   <button
                                     onClick={(e) => startEditing(e, rank)}
                                     className="p-1 text-white/30 hover:text-white transition-all hover:bg-white/10 rounded"
                                     title="Rename"
                                   >
                                       <Edit2 size={12} />
                                   </button>
                               </div>
                           )}
                         </div>

                         <div className="flex items-center gap-2 text-[12px] text-white/40 mt-0.5">
                            <span className="capitalize">{rank.type === 'tierlist' ? 'Tier List' : 'Ranking Grid'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>{new Date(rank.updatedAt).toLocaleDateString()}</span>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center gap-2 pl-3">
                          {rank.id === activeRankId && (
                              <Check size={16} className="text-blue-500 mr-1" />
                          )}

                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRank(rank.id);
                              }}
                              className={`p-2 rounded-lg transition-all ${ranks.length === 1 ? 'text-white/10 cursor-not-allowed' : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}
                              disabled={ranks.length === 1}
                              title={ranks.length === 1 ? "Cannot delete the only project" : "Delete Project"}
                          >
                              <Trash2 size={16} strokeWidth={1.5} />
                          </button>

                          <div className="text-white/20 group-hover:text-white/40 transition-colors">
                              <ChevronRight size={16} strokeWidth={2} />
                          </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          )}
        </div>
    </Modal>
  );
};

