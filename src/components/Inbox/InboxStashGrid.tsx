import React, { type RefObject, useState, useRef, useEffect } from "react";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import type { InboxItem, InteractionState } from "@/types";
import { CuteSlime } from "@/components/EmptyStateVector";
import { InboxItemCard } from "./InboxItemCard";
import { motion, AnimatePresence } from "framer-motion";

export interface InboxStashGridProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  currentItems: InboxItem[];
  activeCollectionId: string;
  isAllView: boolean;
  usedOnBoard: Set<string>;
  selectedItemIds: Set<string>;
  interactionState: InteractionState;
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onItemClick: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (item: InboxItem) => void;
  onRecall: (imageSrc: string) => void;
}

export const InboxStashGrid = React.memo<InboxStashGridProps>(({
  fileInputRef,
  currentItems,
  activeCollectionId,
  isAllView,
  usedOnBoard,
  selectedItemIds,
  interactionState,
  onUploadClick,
  onFileChange,
  onItemClick,
  onDeleteItem,
  onRecall,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = React.useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 150);
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [currentItems, checkScroll]);

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
          <AnimatePresence mode="wait">
            {currentItems.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                role="button"
                tabIndex={0}
                onClick={() => !isAllView && onUploadClick()}
                onKeyDown={(e) => {
                  if (!isAllView && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onUploadClick();
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center text-muted text-[13px] font-medium select-none h-full border border-dashed border-border rounded-2xl bg-surface-secondary p-4 transition-colors ${!isAllView ? "cursor-pointer hover:border-primary hover:bg-hover hover:text-text" : ""}`}
              >
                <CuteSlime className="w-16 h-16 text-muted mb-4" />
                {isAllView ? (
                  "Your library is empty."
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <span className="mb-1 leading-tight max-w-[200px]">
                      Drag items here or move them from the board
                    </span>
                    <span className="text-[11px] uppercase tracking-widest text-blue-400/80 mt-2 font-bold group-hover:text-blue-400">
                      Tap to Upload
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="items-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 items-center h-full"
              >
                {!isAllView && (
                  <button
                    type="button"
                    onClick={onUploadClick}
                    className="shrink-0 w-28 h-40 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted hover:text-blue-400 hover:border-blue-400 transition-all group bg-surface-secondary hover:bg-hover"
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
                <div className="flex gap-4 h-full items-center">
                  <AnimatePresence mode="popLayout">
                    {currentItems.map((item) => {
                      const isUsed = usedOnBoard.has(item.imageSrc);
                      const isSelected =
                        selectedItemIds.has(item.id) ||
                        (interactionState?.type === "inbox" &&
                          interactionState.itemId === item.id);

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          key={`${isAllView ? 'all' : activeCollectionId}-${item.id}`}
                          className="shrink-0"
                        >
                          <InboxItemCard
                            item={item}
                            isUsed={isUsed}
                            isSelected={isSelected}
                            isAllView={isAllView}
                            collectionId={isAllView ? "all-images" : activeCollectionId}
                            onItemClick={onItemClick}
                            onDeleteItem={onDeleteItem}
                            onRecall={onRecall}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-surface-elevated backdrop-blur-xl border border-border rounded-full text-text shadow-2xl animate-in fade-in slide-in-from-left-2 duration-300 md:hidden"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
      )}
      {showRight && (
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-surface-elevated backdrop-blur-xl border border-border rounded-full text-text shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300 md:hidden"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});
