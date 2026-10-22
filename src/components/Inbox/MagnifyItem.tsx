import { motion, useTransform } from "motion/react";
import {
  MAG_ITEM_ATTR,
  MAG_MAX_SCALE,
  MAG_PUSH,
  MAG_REACH,
  type MagnificationContext,
} from "@/hooks/useMagnification";

/**
 * One magnified item. Kept as a component so its `useTransform` hooks are
 * unconditionally called, rather than being created from a parent callback.
 */
export const MagnifyItem: React.FC<{
  index: number;
  ctx: MagnificationContext;
  children: React.ReactNode;
  className?: string;
}> = ({ index, ctx, children, className }) => {
  // Quadratic falloff: a linear one has a visible corner where an item stops
  // growing, which reads as a bug rather than as a boundary.
  //
  // The array form of `useTransform` needs an explicit tuple type, or it
  // infers `number[]` and every arithmetic operation on it errors.
  const scale = useTransform<number, number>(
    [ctx.pointerX, ctx.engaged],
    ([px, on]: number[]) => {
      const center = ctx.centers.current[index];
      if (!on || center === undefined) return 1;
      const distance = Math.abs(px - center);
      if (distance >= MAG_REACH) return 1;
      const falloff = 1 - distance / MAG_REACH;
      return 1 + falloff * falloff * MAG_MAX_SCALE;
    }
  );

  const x = useTransform<number, number>(
    [ctx.pointerX, ctx.engaged],
    ([px, on]: number[]) => {
      const center = ctx.centers.current[index];
      if (!on || center === undefined) return 0;
      const delta = px - center;
      const distance = Math.abs(delta);
      if (distance >= MAG_REACH) return 0;
      const falloff = 1 - distance / MAG_REACH;
      // Shove away from the pointer so neighbours make room for the growth.
      return -delta * falloff * MAG_PUSH;
    }
  );

  return (
    <motion.div
      {...{ [MAG_ITEM_ATTR]: "" }}
      style={{ scale, x, transformOrigin: "center bottom" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};