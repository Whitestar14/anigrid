import React from 'react';
import { GridConfig, GridStyle, RankMode, ProjectType } from '@/types';
import { 
  Maximize2, Grid, Hash, Type, Calendar, 
  List, LayoutGrid, Trash2, Save, Upload,
  Settings2, ChevronLeft, ChevronRight, Layers,
  SquareDashedKanban, Square, Monitor, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface GridSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  config: GridConfig;
  style: GridStyle;
  mode: RankMode;
  projectType: ProjectType;
  showNumbers: boolean;
  showTitle: boolean;
  showDate: boolean;
  showTiers: boolean; 
  borderless: boolean; // New prop
  gap: number;
  rankBackgroundColor: string;
  onConfigChange: (config: GridConfig) => void;
  onStyleChange: (style: GridStyle) => void;
  onModeChange: (mode: RankMode) => void;
  onVisualToggle: (key: 'showNumbers' | 'showTitle' | 'showDate' | 'showTiers') => void;
  onBorderlessChange: (borderless: boolean) => void; // New handler
  onGapChange: (gap: number) => void;
  onBackgroundColorChange: (color: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onClearAll: () => void;
}

const GRID_BG_COLORS = ['transparent', '#ffffff', '#0f1115', '#181b21', '#1a202c', '#2d3748', '#000000'];

export const GridSettingsSidebar: React.FC<GridSettingsSidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  config,
  style,
  mode,
  projectType,
  showNumbers,
  showTitle,
  showDate,
  showTiers,
  borderless,
  gap,
  rankBackgroundColor,
  onConfigChange,
  onStyleChange,
  onModeChange,
  onVisualToggle,
  onBorderlessChange,
  onGapChange,
  onBackgroundColorChange,
  onExportJson,
  onImportJson,
  onClearAll,
}) => {
  const jsonInputRef = React.useRef<HTMLInputElement>(null);

  const handleRowsChange = (val: number) => {
    const r = Math.max(1, Math.min(50, val));
    onConfigChange({ ...config, rows: r });
  };
  
  const handleColsChange = (val: number) => {
    const c = Math.max(1, Math.min(20, val));
    onConfigChange({ ...config, cols: c });
  };

  return (
    <>
       <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

       <aside 
         className={`
           border-r border-white/10 bg-[#1c1c1e]/90 backdrop-blur-3xl shadow-2xl flex shrink-0 z-40
           fixed top-14 bottom-0 left-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
           ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'}
           md:static
           ${isOpen ? 'md:translate-x-0 md:w-80 md:mr-0 md:opacity-100' : 'md:-translate-x-full md:w-0 md:mr-0 md:opacity-0 md:border-none'}
           overflow-hidden
         `}
       >
         <div className="relative w-80 h-full">
            {/* Expanded Content */}
            <div 
                className={`
                    absolute inset-y-0 left-0 w-80 flex flex-col overflow-y-auto custom-scrollbar overflow-x-hidden
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100 delay-150' : 'opacity-0 pointer-events-none'}
                `}
            >
                <div className="flex flex-col gap-8 py-6 w-80">
                    {/* Header Section: Project Type */}
                <div className="flex items-center justify-between gap-4 p-4 bg-[#2c2c2e] rounded-[20px] mx-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${projectType === 'tierlist' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {projectType === 'tierlist' ? <Layers size={24} /> : <LayoutGrid size={24} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">Project Type</span>
                            <span className="text-lg font-semibold text-white leading-tight tracking-tight">
                                {projectType === 'tierlist' ? 'Tier List' : 'Ranking Grid'}
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
                {projectType === 'ranking' && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">View Mode</span>
                    <div className="flex bg-[#767680]/24 p-1 rounded-xl mx-4">
                      <button 
                        onClick={() => onModeChange('grid')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-colors text-[13px] font-medium ${mode === 'grid' ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}
                      >
                        <LayoutGrid size={14} /> Grid
                      </button>
                      <button 
                        onClick={() => onModeChange('list')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-colors text-[13px] font-medium ${mode === 'list' ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}
                      >
                        <List size={14} /> List
                      </button>
                    </div>
                  </div>
                )}

                <div className="h-px bg-white/10 mx-4"></div>

                {/* Grid Specifics (Ranking Only) */}
                {projectType === 'ranking' && (
                <>
                    <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">Dimensions</span>
                    {mode === 'grid' ? (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#2c2c2e] rounded-[20px] mx-4">
                            <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[11px] text-white/50 font-medium uppercase">Rows</span>
                                <input 
                                  type="number" min="1" max="50"
                                  value={config.rows}
                                  onChange={(e) => handleRowsChange(parseInt(e.target.value))}
                                  className="text-center font-medium bg-transparent text-white focus:outline-none w-full"
                                />
                            </div>
                            <span className="text-white/50 font-medium">×</span>
                            <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[11px] text-white/50 font-medium uppercase">Cols</span>
                                <input 
                                  type="number" min="1" max="20"
                                  value={config.cols}
                                  onChange={(e) => handleColsChange(parseInt(e.target.value))}
                                  className="text-center font-medium bg-transparent text-white focus:outline-none w-full"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 px-4 py-3 bg-[#2c2c2e] rounded-[20px] mx-4">
                                <span className="text-[11px] text-white/50 font-medium uppercase">Items</span>
                                <input 
                                  type="number" min="1" max="100"
                                  value={config.rows}
                                  onChange={(e) => handleRowsChange(parseInt(e.target.value))}
                                  className="text-center font-medium bg-transparent text-white focus:outline-none w-full"
                                />
                        </div>
                    )}
                    </div>
                    <div className="h-px bg-white/10 mx-4"></div>
                </>
                )}

                {/* Section: Appearance */}
                {projectType === 'ranking' && mode === 'grid' && (
                    <>
                    <div className="flex flex-col gap-4">
                        <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">Appearance</span>
                        
                        <div className="flex flex-col gap-4 px-4 py-4 bg-[#2c2c2e] rounded-[20px] mx-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-[13px] font-medium text-white/70 mb-1">
                                    <span>Spacing</span>
                                    <span className="text-white">{gap}px</span>
                                </div>
                                <input 
                                    type="range" min="0" max="32" step="2"
                                    value={gap}
                                    onChange={(e) => onGapChange(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer focus:outline-none accent-blue-500"
                                />
                            </div>

                            <div className="h-px bg-white/10 -mx-4"></div>

                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-white/70 font-medium">Grid Style</span>
                                <div className="flex bg-[#767680]/24 p-1 rounded-xl">
                                    <button onClick={() => onStyleChange('seamless')} title="Seamless" className={`p-1.5 rounded-lg transition-colors ${style === 'seamless' ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}><Maximize2 size={16} /></button>
                                    <button onClick={() => onStyleChange('card')} title="Cards" className={`p-1.5 rounded-lg transition-colors ${style === 'card' ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}><Grid size={16} /></button>
                                </div>
                            </div>
                            
                            {style === 'seamless' && (
                                <>
                                <div className="h-px bg-white/10 -mx-4"></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] text-white/70 font-medium">Borders</span>
                                    <div className="flex bg-[#767680]/24 p-1 rounded-xl">
                                        <button onClick={() => onBorderlessChange(false)} title="Show Borders" className={`p-1.5 rounded-lg transition-colors ${!borderless ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}><SquareDashedKanban size={16} /></button>
                                        <button onClick={() => onBorderlessChange(true)} title="Borderless" className={`p-1.5 rounded-lg transition-colors ${borderless ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}><Square size={16} /></button>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="h-px bg-white/10 mx-4"></div>
                    </>
                )}

                {/* Section: Visibility (Global) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">Visibility</span>
                  <div className="grid grid-cols-3 gap-2 px-4">
                      {projectType === 'ranking' && mode === 'grid' && (
                        <button 
                            onClick={() => onVisualToggle('showNumbers')} 
                            className={`flex flex-col items-center justify-center h-auto py-3 gap-1.5 rounded-xl transition-colors text-[13px] font-medium ${showNumbers ? 'bg-blue-500/20 text-blue-500' : 'bg-[#2c2c2e] text-white/70 hover:bg-[#3a3a3c] hover:text-white'}`}
                        >
                            <Hash size={16} /> Rank
                        </button>
                      )}
                      <button 
                          onClick={() => onVisualToggle('showVisualToggle')} 
                          className={`flex flex-col items-center justify-center h-auto py-3 gap-1.5 rounded-xl transition-colors text-[13px] font-medium ${showTitle ? 'bg-blue-500/20 text-blue-500' : 'bg-[#2c2c2e] text-white/70 hover:bg-[#3a3a3c] hover:text-white'}`}
                      >
                        <Type size={16} /> Title
                      </button>
                      <button 
                          onClick={() => onVisualToggle('showDate')} 
                          className={`flex flex-col items-center justify-center h-auto py-3 gap-1.5 rounded-xl transition-colors text-[13px] font-medium ${showDate ? 'bg-blue-500/20 text-blue-500' : 'bg-[#2c2c2e] text-white/70 hover:bg-[#3a3a3c] hover:text-white'}`}
                      >
                        <Calendar size={16} /> Date
                      </button>
                  </div>
                </div>

                <div className="h-px bg-white/10 mx-4"></div>

                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium text-white/50 uppercase tracking-wide pl-4">Data Actions</span>
                  
                  <div className="flex flex-col gap-px bg-[#2c2c2e] rounded-[20px] mx-4 overflow-hidden">
                      <button 
                        onClick={onExportJson} 
                        className="flex items-center gap-3 px-4 py-3 text-[15px] text-white hover:bg-white/5 transition-colors text-left"
                      >
                        <Save size={18} className="text-blue-500" /> Backup
                      </button>
                      <div className="h-px bg-white/10 ml-12"></div>
                      <button 
                        onClick={() => jsonInputRef.current?.click()} 
                        className="flex items-center gap-3 px-4 py-3 text-[15px] text-white hover:bg-white/5 transition-colors text-left"
                      >
                        <Upload size={18} className="text-blue-500" /> Restore
                      </button>
                      <div className="h-px bg-white/10 ml-12"></div>
                      <button 
                        onClick={onClearAll} 
                        className="flex items-center gap-3 px-4 py-3 text-[15px] text-[#ff453a] hover:bg-white/5 transition-colors text-left"
                      >
                        <Trash2 size={18} /> Clear {projectType === 'tierlist' ? 'Tiers' : 'Grid'}
                      </button>
                  </div>
                
                <div className="h-10"></div>
            </div>
            </div>
          </div>
         </div>
       </aside>
    </>
  );
};
