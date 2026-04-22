import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Plus, Check, RefreshCw, WifiOff } from 'lucide-react';
import { JikanResult } from '@/types';
import { Input } from '@/components/ui/Input';
import { getProxiedImageUrl } from '@/utils/imageProxy';

interface SearchPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  mode: 'anime' | 'characters';
  onModeChange: (m: 'anime' | 'characters') => void;
  results: JikanResult[];
  onResultsChange: (results: JikanResult[]) => void;
  onDragStart: (e: React.DragEvent, imageSrc: string) => void;
  onDragEnd: () => void;
  onAdd: (imageSrc: string) => void;
  usedImageSrcs: Set<string>; // New prop for feedback
}

const SearchItem: React.FC<{
  item: any;
  imgSrc: string;
  label: string;
  isAdded: boolean;
  onDragStart: (e: React.DragEvent, imgSrc: string) => void;
  onDragEnd: () => void;
  onAdd: (imgSrc: string) => void;
}> = ({ _item, imgSrc, label, isAdded, onDragStart, onDragEnd, onAdd }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(e, imgSrc);
        setTimeout(() => setIsDragging(true), 0);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={`
        group relative shrink-0 w-28 h-40 rounded-2xl overflow-hidden border border-white/10 bg-[#2c2c2e] cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 transition-all shadow-md duration-200 ease-out
        ${isAdded ? 'opacity-80' : ''}
        ${isDragging ? 'opacity-50 scale-95 ring-2 ring-green-500 drop-shadow-lg' : ''}
      `}
      title={label}
    >
      <img
        src={getProxiedImageUrl(imgSrc)}
        alt={label}
        className={`w-full h-full object-cover pointer-events-none transition-all ${isAdded ? 'grayscale' : ''}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

      {/* Add Button / Check Indicator */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            if (!isAdded) onAdd(imgSrc);
        }}
        className={`
          absolute top-2 right-2 p-1.5 rounded-full shadow-sm border border-white/20 hover:scale-110 transition-all z-10 backdrop-blur-md
          ${isAdded ? 'bg-green-500/90 text-white cursor-default' : 'bg-blue-500/90 text-white'}
        `}
        title={isAdded ? "Already added" : "Add to Collection"}
      >
        {isAdded ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
      </button>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-[11px] font-medium text-white text-center leading-tight line-clamp-2 pointer-events-none drop-shadow-md">
        {label}
      </div>
    </div>
  );
};

export const SearchPanel: React.FC<SearchPanelProps> = ({
  query,
  onQueryChange,
  mode,
  onModeChange,
  results,
  onResultsChange,
  onDragStart,
  onDragEnd,
  onAdd,
  usedImageSrcs
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isNetwork?: boolean } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        performSearch();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, mode]);

  const performSearch = async () => {
    if (!query || query.length <= 2) return;

    setLoading(true);
    setError(null);

    try {
      if (!navigator.onLine) {
          throw new Error("offline");
      }

      const response = await fetch(`https://api.jikan.moe/v4/${mode}?q=${encodeURIComponent(query)}&limit=15&order_by=favorites&sort=desc`);

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limited. Please wait a moment.");
        if (response.status >= 500) throw new Error("Jikan API is currently down.");
        throw new Error("Failed to fetch results.");
      }

      const data = await response.json();
      onResultsChange(data.data || []);
    } catch (err: any) {
      console.error("Search error:", err);
      if (err.message === "offline" || err.name === "TypeError") { // fetch throws TypeError on network failure
          setError({ message: "No internet connection.", isNetwork: true });
      } else {
          setError({ message: err.message || 'Search failed.' });
      }
      onResultsChange([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200 px-2">
      {/* Search Bar & Toggles */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            icon={<Search size={16} className="text-white/50" />}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${mode} on MAL...`}
            className="font-medium bg-[#2c2c2e] border-transparent focus:border-white/20 focus:ring-1 focus:ring-white/20 text-[15px] rounded-xl h-10"
          />
        </div>

        <div className="flex bg-[#767680]/24 rounded-xl p-1 shrink-0">
          <button
            onClick={() => onModeChange('anime')}
            className={`px-4 py-1.5 text-[13px] font-medium transition-all rounded-lg ${mode === 'anime' ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            Anime
          </button>
          <button
            onClick={() => onModeChange('characters')}
            className={`px-4 py-1.5 text-[13px] font-medium transition-all rounded-lg ${mode === 'characters' ? 'bg-[#636366] text-white shadow-sm' : 'text-white/70 hover:text-white'}`}
          >
            Chars
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-x-auto min-h-[170px] custom-scrollbar pb-2">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-white/50 gap-3">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-[13px] font-medium">Searching MAL...</span>
          </div>
        ) : error ? (
          <div className="h-40 flex flex-col items-center justify-center text-white/50 gap-3 p-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-1">
                {error.isNetwork ? <WifiOff size={24} /> : <AlertCircle size={24} />}
            </div>
            <span className="text-[13px] font-medium text-white">{error.message}</span>
            <button
                onClick={performSearch}
                className="mt-2 flex items-center gap-2 px-5 py-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/10 rounded-full text-[13px] font-medium transition-colors text-white"
            >
                <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="flex gap-4 pb-4 px-2">
             {results.map((item) => {
               const imgSrc = item.images.jpg.large_image_url || item.images.jpg.image_url;
               const label = item.title || item.name || 'Unknown';
               const isAdded = usedImageSrcs.has(imgSrc);

               return (
                   <SearchItem
                   key={item.mal_id}
                   item={item}
                   imgSrc={imgSrc}
                   label={label}
                   isAdded={isAdded}
                   onDragStart={onDragStart}
                   onDragEnd={onDragEnd}
                   onAdd={onAdd}
                 />
               );
             })}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-white/40 opacity-80 select-none">
            <Search size={36} className="mb-3 opacity-50" strokeWidth={1.5} />
            <span className="text-[13px] font-medium">Search for your favorites</span>
          </div>
        )}
      </div>
    </div>
  );
};
