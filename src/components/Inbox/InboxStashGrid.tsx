import React, { type RefObject, useState, useRef, useEffect } from "react";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import type { InboxItem, InteractionState } from "@/types";
import { CuteSlime } from "@/components/EmptyStateVector";
import { InboxItemCard } from "./InboxItemCard";

export interface InboxStashGridProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  currentItems: InboxItem[];
  isAllView: boolean;
  usedOnBoard: Set<string>;
  selectedItemIds: Set<string>;
  interactionState: InteractionState;
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEndExpand: () => void;
  onItemClick: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (item: InboxItem) => void;
  onRecall: (imageSrc: string) => void;
}

export const InboxStashGrid: React.FC<InboxStashGridProps> = ({
  fileInputRef,
  currentItems,
  isAllView,
  usedOnBoard,
  selectedItemIds,
  interactionState,
  onUploadClick,
  onFileChange,
  onDragStart,
  onDragEndExpand,
  onItemClick,
  onDeleteItem,
  onRecall,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    checkScroll();
    // Use a small delay to ensure DOM is settled
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [currentItems]);

  const handleScroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col group/grid">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar"
      >
        <div className="flex gap-4 h-full items-center">
          {currentItems.length === 0 ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => !isAllView && onUploadClick()}
              onKeyDown={(e) => {
                if (!isAllView && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onUploadClick();
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center text-white/40 text-[13px] font-medium select-none h-full border border-dashed border-white/10 rounded-2xl bg-[#2c2c2e]/30 p-4 transition-colors ${!isAllView ? "cursor-pointer hover:border-white/20 hover:bg-[#2c2c2e]/50 hover:text-white/60" : ""}`}
            >
              <CuteSlime className="w-16 h-16 text-white/20 mb-4" />
              {isAllView ? (
                "Your library is empty."
              ) : (
                <div className="flex flex-col items-center">
                  <span className="mb-1 leading-tight">
                    Drag items here or move them from the board
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-blue-400/80 mt-2 font-bold group-hover:text-blue-400">
                    Tap to Upload
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isAllView && (
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="shrink-0 w-28 h-40 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/50 hover:text-blue-400 hover:border-blue-400 transition-all group bg-[#2c2c2e]/50 hover:bg-[#3a3a3c]/50"
                >
                  <Upload
                    size={24}
                    className="group-hover:scale-110 transition-transform mb-3"
                    strokeWidth={1.5}
                  />
                  <span className="text-[11px] font-medium uppercase tracking-widest">
                    Upload
                  </span>
                </button>
              )}
              {currentItems.map((item) => {
                const isUsed = usedOnBoard.has(item.imageSrc);
                const isSelected =
                  selectedItemIds.has(item.id) ||
                  (interactionState?.type === "inbox" &&
                    interactionState.itemId === item.id);

                return (
                  <InboxItemCard
                    key={item.id}
                    item={item}
                    isUsed={isUsed}
                    isSelected={isSelected}
                    isAllView={isAllView}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEndExpand}
                    onItemClick={onItemClick}
                    onDeleteItem={onDeleteItem}
                    onRecall={onRecall}
                  />
                );
              })}
            </>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          accept="image/*"
          onChange={onFileChange}
        />
      </div>

      {/* Floating Chevrons for Mobile Accessibility */}
      {showLeft && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl animate-in fade-in slide-in-from-left-2 duration-300 md:hidden"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
      )}
      {showRight && (
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300 md:hidden"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
