import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { GridView } from "@/components/views/GridView";
import { ListView } from "@/components/views/ListView";
import { TierListView } from "@/components/views/TierListView";
import { PixelWordmark } from "@/components/app/PixelWordmark";
import type { Rank } from "@/types";
import { motion as motionPreset } from "@/lib/motion";

/** Cross-fades between the three board layouts. */
export const BoardView: React.FC<{ activeRank: Rank }> = ({ activeRank }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={`${activeRank.id}-${activeRank.type}`}
      /* The outgoing view leaves quickly so the incoming one is not delayed,
         then the new one springs in. `mode="wait"` keeps the two from
         overlapping mid-flight. */
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: motionPreset.enter,
      }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
    >
      {activeRank.type === "tierlist" ? (
        <TierListView />
      ) : activeRank.type === "list" ? (
        <ListView />
      ) : (
        <GridView />
      )}
    </motion.div>
  </AnimatePresence>
);

/** The board's signature line: app watermark and export date. */
export const BoardWatermark: React.FC<{
  activeRank: Rank;
  textColor: string;
}> = ({ activeRank, textColor }) => {
  /* Both flags default to shown, and both are tested with `!== false` rather
     than for truthiness. A project saved before `showWatermark` existed has it
     as `undefined`, and a truthiness test would hide the mark on those boards
     while the rail's toggle still reported it as on. */
  const showWatermark = activeRank.showWatermark !== false;
  const showDate = activeRank.showDate !== false;

  if (!showWatermark && !showDate) return null;

  return (
    <div className="flex justify-between items-end px-2 mt-8 pt-4 border-t border-hairline opacity-45">
      {showWatermark && (
        <div className="flex items-center" style={{ color: textColor }}>
          {/* 14px is exactly two bitmap pixels per unit, so the word stays
              crisp instead of picking up uneven steps. */}
          <PixelWordmark />
        </div>
      )}
      {showDate && (
        <div
          className="text-caption-2 font-medium tabular-nums"
          style={{ color: textColor }}
        >
          {new Date().toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
