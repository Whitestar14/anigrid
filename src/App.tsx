import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useStore as useZustandStore } from 'zustand';
import { Controls } from '@/components/Controls';
import { GridSettingsSidebar } from '@/components/GridSettingsSidebar';
import { GridView } from '@/components/views/GridView';
import { ListView } from '@/components/views/ListView';
import { TierListView } from '@/components/views/TierListView'; 
import { Inbox } from '@/components/Inbox';
import { Library } from '@/components/Library';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DuplicateModal } from '@/components/DuplicateModal';
import { ExportModal } from '@/components/ExportModal';
import { ToastContainer, ToastMessage, ToastType } from '@/components/ui/Toast';
import { GridConfig, CellData, InboxItem, GlobalState, Rank, InboxCollection, GlobalTheme, RankMode, InteractionState, TierRow, ProjectType } from '@/types';
import { readFileAsDataURL, downloadGrid } from '@/utils/imageUtils';
import { saveState, loadState, exportStateToJson, migrateState } from '@/utils/storage';
import { Edit2, Heart, Zap } from 'lucide-react';

// --- Palette System Definitions ---
const THEME_PALETTES = [
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      background: '#0f1115',
      surface: '#181b21',
      border: '#2a2e36',
      text: '#e2e8f0',
      muted: '#94a3b8',
      hover: 'rgba(255, 255, 255, 0.06)',
      overlay: 'rgba(0, 0, 0, 0.8)'
    }
  },
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      background: '#0f172a', // Slate 900
      surface: '#1e293b', // Slate 800
      border: '#334155', // Slate 700
      text: '#f1f5f9', // Slate 100
      muted: '#94a3b8', // Slate 400
      hover: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(15, 23, 42, 0.8)'
    }
  },
  {
    id: 'oled',
    name: 'OLED',
    colors: {
      background: '#000000',
      surface: '#0a0a0a',
      border: '#262626', // Neutral 800
      text: '#e5e5e5', // Neutral 200
      muted: '#737373', // Neutral 500
      hover: 'rgba(255, 255, 255, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.9)'
    }
  },
  {
    id: 'cloud',
    name: 'Cloud',
    colors: {
      background: '#ffffff',
      surface: '#f8fafc', // Slate 50
      border: '#e2e8f0', // Slate 200
      text: '#0f172a', // Slate 900
      muted: '#64748b', // Slate 500
      hover: 'rgba(15, 23, 42, 0.05)',
      overlay: 'rgba(255, 255, 255, 0.8)'
    }
  },
  {
    id: 'dawn',
    name: 'Dawn',
    colors: {
      background: '#fff1f2', // Rose 50 (Tinted Background)
      surface: '#ffffff',
      border: '#e2e8f0', // Slate 200 (Neutral Border)
      text: '#334155', // Slate 700 (Neutral Text)
      muted: '#94a3b8', // Slate 400
      hover: 'rgba(15, 23, 42, 0.05)',
      overlay: 'rgba(255, 255, 255, 0.8)'
    }
  },
  {
    id: 'latte',
    name: 'Latte',
    colors: {
      background: '#fdfbf7', // Warm off-white
      surface: '#f5f0e8',
      border: '#e7e5e4', // Stone 200
      text: '#44403c', // Stone 700
      muted: '#a8a29e', // Stone 400
      hover: 'rgba(28, 25, 23, 0.05)',
      overlay: 'rgba(253, 251, 247, 0.8)'
    }
  }
];

const getContrastColor = (hex: string) => {
    if (hex === 'transparent') return 'var(--color-text)';
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export const App: React.FC = () => {
  const state = useStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [internalClipboard, setInternalClipboard] = useState<string | null>(null);
  
  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: ToastType, message: string, actionLabel?: string, action?: () => void) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, actionLabel, action }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Modals
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const gridRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
    useStore.persist.onFinishHydration(() => setIsLoaded(true));
    if (useStore.persist.hasHydrated()) {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && state.theme) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', state.theme.accentColor);
      const paletteId = state.theme.paletteId || 'midnight';
      const palette = THEME_PALETTES.find(p => p.id === paletteId) || THEME_PALETTES[0];
      root.style.setProperty('--color-background', palette.colors.background);
      root.style.setProperty('--color-surface', palette.colors.surface);
      root.style.setProperty('--color-border', palette.colors.border);
      root.style.setProperty('--color-text', palette.colors.text);
      root.style.setProperty('--color-muted', palette.colors.muted);
      root.style.setProperty('--color-hover', palette.colors.hover);
      root.style.setProperty('--color-overlay', palette.colors.overlay);
      const isLight = ['cloud', 'dawn', 'latte'].includes(palette.id);
      if (isLight) {
          root.classList.remove('dark');
          root.classList.add('light');
      } else {
          root.classList.remove('light');
          root.classList.add('dark');
      }
    }
  }, [state.theme, isLoaded]);

  // Global Paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
             try {
                const src = await readFileAsDataURL(blob);
                if (state.interactionState?.type === 'cell') {
                    state.handleCellUpload(state.interactionState.index, src);
                } else {
                    const activeColId = state.inbox.activeCollectionId === 'all-images' 
                        ? state.inbox.collections[0].id 
                        : state.inbox.activeCollectionId;
                    state.handleAddToCollection(src, activeColId);
                }
             } catch(err) { console.error(err); }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [state.inbox.activeCollectionId, state.inbox.collections, state.handleAddToCollection, state.interactionState, state.handleCellUpload]);

  const activeRank = state.ranks[state.activeRankId];

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

        if (e.key === 'Escape') {
            state.setInteractionState(null);
            setIsEditingTitle(false);
            return;
        }

        // Copy/Paste internal
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            if (state.interactionState?.type === 'cell' && activeRank) {
                const cell = activeRank.cells[state.interactionState.index];
                if (cell && cell.imageSrc) {
                    setInternalClipboard(cell.imageSrc);
                }
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            if (state.interactionState?.type === 'cell' && activeRank && internalClipboard) {
                state.handleCellUpload(state.interactionState.index, internalClipboard);
            }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.interactionState?.type === 'cell' && activeRank) {
                state.handleCellClear(state.interactionState.index);
                state.setInteractionState(null);
            }
            // For Tier Item delete
            if (state.interactionState?.type === 'tier-item' && activeRank) {
                state.handleTierItemRemove(state.interactionState.rowId, state.interactionState.itemId);
                state.setInteractionState(null);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.interactionState, activeRank, state.handleCellClear, state.handleTierItemRemove, state.setInteractionState, internalClipboard, state.handleCellUpload]);

  const activeCollection = state.inbox.collections.find(c => c.id === state.inbox.activeCollectionId);
  
  const confirmAction = (title: string, message: string, action: () => void) => {
    setModalConfig({ isOpen: true, title, message, onConfirm: () => { action(); setModalConfig(prev => ({ ...prev, isOpen: false })); } });
  };

  // Track images present in the Inbox (for Search Panel checks)
  const inboxImageSet = useMemo(() => {
    const set = new Set<string>();
    if (state.inbox) {
        state.inbox.collections.forEach(c => c.items.forEach(i => set.add(i.imageSrc)));
    }
    return set;
  }, [state.inbox]);

  // Track images present on the current Board (for Stash gray-out)
  const boardImageSet = useMemo(() => {
    const set = new Set<string>();
    if (activeRank) {
        if (activeRank.type === 'tierlist') {
             activeRank.tierRows.forEach(row => row.items.forEach(item => {
                 if (item.imageSrc) set.add(item.imageSrc);
             }));
        } else {
             activeRank.cells.forEach(cell => {
                 if (cell.imageSrc) set.add(cell.imageSrc);
             });
        }
    }
    return set;
  }, [activeRank]);

  const handleClearAll = () => {
    if (!activeRank) return;
    
    confirmAction(
      "Clear All?", 
      "All content will be removed.",
      () => {
          state.handleClearAll();
      }
    );
  };

  const handleDeleteRank = (id: string) => {
    confirmAction("Delete Project?", "Cannot be undone.", () => {
        state.handleDeleteRank(id);
    });
  };

  const handleExportJson = () => {
    exportStateToJson(useStore.getState());
  };

  const handleImportJson = async (file: File) => {
    const text = await file.text();
    try {
        const json = JSON.parse(text);
        const migrated = migrateState(json);
        if (migrated) {
            state.importState(migrated);
        }
    } catch (e) {
        console.error("Failed to import JSON", e);
        alert("Invalid JSON file");
    }
  };

  if (!isLoaded || !state || !activeRank) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
         <div className="grid grid-cols-2 gap-2 w-16 h-16">
               <div className="bg-surface border border-border rounded-full flex items-center justify-center aspect-square"><div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-0"></div></div>
               <div className="bg-surface border border-border rounded-lg flex items-center justify-center aspect-square"><Heart size={20} className="text-primary fill-primary animate-pulse delay-75" /></div>
               <div className="bg-surface border border-border rounded-lg flex items-center justify-center aspect-square"><Zap size={20} className="text-text fill-text animate-pulse delay-150" /></div>
               <div className="bg-primary rounded-[12px] animate-pulse delay-200 aspect-square"></div>
         </div>
        <span className="text-muted font-bold tracking-widest text-xs mt-4">ANIGRID</span>
    </div>
  );

  const textColor = getContrastColor(activeRank.backgroundColor);

  // Responsive padding logic: Less padding on mobile for tier lists to maximize width
  const mainPadding = activeRank.type === 'tierlist' ? 'p-2 md:p-8' : 'p-4 md:p-8';
  // Inner container padding: Default to 0 for Tier Lists on mobile to go edge-to-edge
  const containerPadding = activeRank.type === 'tierlist' 
    ? (window.innerWidth < 768 ? '0px' : '32px')
    : (activeRank.style === 'card' ? '32px' : '16px');

  const handleCellDownload = async (index: number) => {
    const cell = activeRank.cells[index];
    if (!cell || !cell.imageSrc) return;
    
    const link = document.createElement('a');
    link.href = cell.imageSrc;
    link.download = `${activeRank.title}-cell-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[100dvh] bg-background text-text font-sans selection:bg-primary/30 flex flex-col overflow-hidden relative">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <Controls 
        projectName={activeRank.title}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenExport={() => setIsExportModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportImage={(fmt) => {
          if (gridRef.current) {
            downloadGrid(gridRef.current, activeRank.title, fmt);
            addToast('success', `Exported as ${fmt.toUpperCase()}`);
          }
        }}
        onExportJson={() => {
          handleExportJson();
          addToast('success', 'Backup saved successfully');
        }}
      />

      <Library 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        ranks={Object.values(state.ranks)}
        activeRankId={state.activeRankId}
        onSelectRank={state.setActiveRankId}
        onDeleteRank={state.handleDeleteRank}
        onNewRank={state.handleNewRank}
        onUpdateRank={state.updateRankById}
      />
      
      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <DuplicateModal 
        isOpen={state.duplicateModalConfig.isOpen}
        imageSrc={state.duplicateModalConfig.imageSrc}
        onConfirm={state.handleDuplicateConfirm}
        onCancel={() => state.setDuplicateModalConfig({ isOpen: false, imageSrc: null, actionToExecute: null })}
      />

      <div className="flex flex-1 overflow-hidden pt-14">
        <GridSettingsSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            config={activeRank.config}
            style={activeRank.style}
            mode={activeRank.mode}
            projectType={activeRank.type}
            showNumbers={activeRank.showNumbers ?? true}
            showTitle={activeRank.showTitle ?? true}
            showDate={activeRank.showDate ?? true}
            showTiers={activeRank.type === 'tierlist'}
            borderless={activeRank.borderless ?? false}
            gap={activeRank.gap ?? 0}
            rankBackgroundColor={activeRank.backgroundColor}
            onConfigChange={state.handleConfigChange}
            onStyleChange={(s) => state.updateActiveRank({ style: s })}
            onModeChange={state.handleModeChange}
            onVisualToggle={state.handleVisualToggle}
            onBorderlessChange={(borderless) => state.updateActiveRank({ borderless })}
            onGapChange={(gap) => state.updateActiveRank({ gap })}
            onBackgroundColorChange={(color) => state.updateActiveRank({ backgroundColor: color })}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onClearAll={handleClearAll}
        />

        <div className="flex-1 flex flex-col min-w-0 relative bg-background">
            <main 
                className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center ${mainPadding} pb-40`}
                onClick={() => state.interactionState && state.setInteractionState(null)}
            >
                <div 
                  ref={gridRef}
                  className="relative transition-all duration-300 shadow-2xl"
                  style={{ 
                      width: 'fit-content',
                      minWidth: activeRank.mode === 'list' ? '100%' : (activeRank.type === 'tierlist' ? '98%' : 'auto'),
                      maxWidth: activeRank.type === 'tierlist' ? '1200px' : 'none',
                      backgroundColor: activeRank.backgroundColor === 'transparent' ? '' : activeRank.backgroundColor,
                      padding: containerPadding,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(activeRank.showTitle !== false || isEditingTitle) && (
                      <div className="text-center mb-8 pb-4 border-b border-white/5">
                        {isEditingTitle ? (
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={activeRank.title}
                            onChange={(e) => state.updateActiveRank({ title: e.target.value })}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            className="text-4xl md:text-5xl font-black text-center bg-transparent border-b-2 border-primary focus:outline-none w-full max-w-2xl placeholder-white/20"
                            style={{ color: textColor }}
                          />
                        ) : (
                          <h1 
                            onClick={() => setIsEditingTitle(true)}
                            className="text-4xl md:text-5xl font-black tracking-tighter cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-3 group/title"
                            style={{ color: textColor }}
                          >
                            {activeRank.title}
                            <Edit2 size={20} className="text-muted opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          </h1>
                        )}
                      </div>
                  )}

                  {activeRank.type === 'tierlist' ? (
                      <TierListView 
                          rank={activeRank}
                          onUpdateTierRows={state.handleUpdateTierRows}
                          onInboxDrop={(itemId, colId, rowId, idx) => {
                              state.handleInboxDropToTier(itemId, colId, rowId, idx);
                              state.setInteractionState(null);
                          }}
                          onInboxDropMulti={(itemIds, colId, rowId, idx) => {
                              state.handleInboxDropToTierMulti(itemIds, colId, rowId, idx);
                              state.setInteractionState(null);
                          }}
                          onSearchDrop={(imageSrc, rowId, idx) => {
                              state.handleSearchDropToTier(imageSrc, rowId, idx);
                              state.setInteractionState(null);
                          }}
                          onMoveToInbox={state.handleTierMoveToInbox}
                          interactionState={state.interactionState}
                          onInteract={(rowId, itemId) => state.setInteractionState({ type: 'tier-item', rowId, itemId })}
                          onInternalMove={(srcRow, srcItem, tgtRow, tgtIdx) => {
                              state.handleInternalTierMove(srcRow, srcItem, tgtRow, tgtIdx);
                              state.setInteractionState(null);
                          }}
                      />
                  ) : activeRank.mode === 'list' ? (
                      <ListView 
                          rank={activeRank}
                          onUpload={state.handleCellUpload}
                          onClear={state.handleCellClear}
                          onSwap={state.handleSwapCells}
                          onInboxDrop={state.handleInboxDrop}
                          onInboxDropMulti={state.handleInboxDropMulti}
                          onSearchDrop={state.handleSearchDrop}
                          onMoveToInbox={state.handleMoveToInbox}
                          onUpdateCell={state.handleUpdateCell}
                          interactionState={state.interactionState}
                          onInteract={(index) => {
                              if (state.interactionState?.type === 'inbox') {
                                  state.handleInboxDrop(state.interactionState.itemId, state.interactionState.collectionId, index);
                                  state.setInteractionState(null);
                              } else if (state.interactionState?.type === 'inbox-multi') {
                                  state.handleInboxDropMulti(state.interactionState.itemIds, state.interactionState.collectionId, index);
                                  state.setInteractionState(null);
                              } else if (state.interactionState?.type === 'search') {
                                  state.handleSearchDrop(state.interactionState.imageSrc, index);
                                  state.setInteractionState(null);
                              } else if (state.interactionState?.type === 'cell') {
                                  state.handleSwapCells(state.interactionState.index, index);
                                  state.setInteractionState(null);
                              } else {
                                  state.setInteractionState({ type: 'cell', index });
                              }
                          }}
                      />
                  ) : (
                      <GridView 
                          rank={activeRank}
                          onUpload={state.handleCellUpload}
                          onClear={state.handleCellClear}
                          onSwap={state.handleSwapCells}
                          onInboxDrop={state.handleInboxDrop}
                          onInboxDropMulti={state.handleInboxDropMulti}
                          onSearchDrop={state.handleSearchDrop}
                          onMoveToInbox={state.handleMoveToInbox}
                          onDownloadSingle={handleCellDownload}
                          onUpdateCell={state.handleUpdateCell}
                          interactionState={state.interactionState}
                          onInteract={(index) => {
                              if (state.interactionState?.type === 'inbox') {
                                  state.handleInboxDrop(state.interactionState.itemId, state.interactionState.collectionId, index);
                                  state.setInteractionState(null);
                              } else if (state.interactionState?.type === 'inbox-multi') {
                                  state.handleInboxDropMulti(state.interactionState.itemIds, state.interactionState.collectionId, index);
                                  state.setInteractionState(null);
                              } else if (state.interactionState?.type === 'search') {
                                  state.handleSearchDrop(state.interactionState.imageSrc, index);
                                  state.setInteractionState(null);
                              } else if (state.interactionState?.type === 'cell') {
                                  state.handleSwapCells(state.interactionState.index, index);
                                  state.setInteractionState(null);
                              } else {
                                  state.setInteractionState({ type: 'cell', index });
                              }
                          }}
                      />
                  )}

                  <div className="flex justify-between items-end opacity-30 px-2 mt-8 pt-4 border-t border-white/5">
                    <div className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: textColor }}>
                      AniGrid
                    </div>
                    
                    {activeRank.showDate !== false && (
                      <div className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: textColor }}>
                        {new Date().toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
            </main>

            <Inbox 
              collections={state.inbox.collections}
              activeCollectionId={state.inbox.activeCollectionId}
              usedImageSrcs={inboxImageSet}
              usedOnBoard={boardImageSet}
              onSwitchCollection={state.switchCollection}
              onAddCollection={state.addCollection}
              onDeleteCollection={(id) => {
                  const col = state.inbox.collections.find(c => c.id === id);
                  if (!col) return;
                  confirmAction(`Delete "${col.name}"?`, "All items lost.", () => {
                      state.deleteCollection(id);
                  });
              }}
              onRenameCollection={state.renameCollection}
              onUpload={state.handleInboxUpload} 
              onRemoveItem={state.removeInboxItem}
              onDropFromGrid={state.handleMoveToInbox}
              onDropFromTier={state.handleTierItemRemove}
              lastTargetCollectionId={state.inbox.lastTargetCollectionId}
              onAddToCollection={state.handleAddToCollection}
              onUpdateLastTarget={state.handleUpdateLastTarget}
              onRestoreItem={state.handleRestoreItem}
              interactionState={state.interactionState}
              addToast={addToast}
              onInteract={(itemId, collectionId) => {
                  if (state.interactionState?.type === 'cell') {
                      state.handleInboxDrop(itemId, collectionId, state.interactionState.index);
                      const nextIndex = state.interactionState.index + 1;
                      if (nextIndex < activeRank.cells.length) {
                          state.setInteractionState({ type: 'cell', index: nextIndex });
                      } else {
                          state.setInteractionState(null);
                      }
                  } else if (state.interactionState?.type === 'tier-item') {
                      state.handleInboxDropToTier(itemId, collectionId, state.interactionState.rowId, -1);
                      state.setInteractionState(null);
                  } else {
                      if (activeRank.type === 'ranking') {
                          const firstEmptyIndex = activeRank.cells.findIndex(c => !c.imageSrc);
                          if (firstEmptyIndex !== -1) {
                              state.handleInboxDrop(itemId, collectionId, firstEmptyIndex);
                              const nextIndex = firstEmptyIndex + 1;
                              if (nextIndex < activeRank.cells.length) {
                                  state.setInteractionState({ type: 'cell', index: nextIndex });
                              }
                          } else {
                              state.setInteractionState({ type: 'inbox', itemId, collectionId });
                          }
                      } else {
                          state.setInteractionState({ type: 'inbox', itemId, collectionId });
                      }
                  }
              }}
            />
        </div>
      </div>
    </div>
  );
};