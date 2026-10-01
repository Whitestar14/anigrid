import React, { type RefObject } from "react";
import { Upload } from "lucide-react";
import type { InboxItem, InteractionState } from "@/types";
import { CuteSlime } from "@/components/EmptyStateVector";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { InboxItemCard } from "./InboxItemCard";
import { motion, AnimatePresence } from "motion/react";

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
  const key = isAllView ? "all" : activeCollectionId;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col group/grid">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        accept="image/*"
        onChange={onFileChange}
      />

      <AnimatePresence mode="wait">
        {currentItems.length === 0 ? (
          <motion.div
            key={`empty-state-${key}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="button"
            tabIndex={0}
            onClick={() => !isAllView && onUploadClick()}
            onKeyDown={(e) => {
              if (!isAllView && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onUploadClick();
              }
            }}
            className={`m-4 flex-1 flex flex-col items-center justify-center text-muted text-footnote
                        font-medium select-none border border-dashed border-hairline rounded-card
                        card-veil p-4 transition-colors
                        ${
                          !isAllView
                            ? "cursor-pointer hover:border-primary hover:bg-hover hover:text-text"
                            : ""
                        }`}
          >
            <CuteSlime className="w-16 h-16 text-muted mb-4" />
            {isAllView ? (
              "Your library is empty."
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="mb-1 leading-tight max-w-[200px]">
                  Drag items here or move them from the board
                </span>
                <span className="text-caption-2 uppercase tracking-widest text-primary/80 mt-2 font-bold group-hover/grid:text-primary">
                  Tap to Upload
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`items-${key}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            <ScrollRail
              className="flex-1 min-h-0"
              scrollerClassName="h-full"
              align="center"
              contentClassName="px-4"
            >
              {!isAllView && (
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="shrink-0 w-28 h-40 border border-dashed border-hairline rounded-tile
                             flex flex-col items-center justify-center text-muted
                             hover:text-primary hover:border-primary card-veil hover:bg-hover
                             transition-colors group"
                >
                  <Upload
                    size={24}
                    className="group-hover:scale-110 transition-transform mb-3"
                    strokeWidth={1.5}
                  />
                  <span className="text-caption-2 font-medium uppercase tracking-widest">
                    Upload
                  </span>
                </button>
              )}

              <AnimatePresence mode="popLayout" initial={false}>
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
                      key={`${key}-${item.id}`}
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
            </ScrollRail>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

InboxStashGrid.displayName = "InboxStashGrid";
