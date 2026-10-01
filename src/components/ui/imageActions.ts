import {
  Upload,
  Crop,
  ArrowDownToLine,
  Download,
  Trash2,
  Globe,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { PopoverAction } from "@/components/ui/PopoverMenu";


export interface ImageActionHandlers {
  /** Open the file picker, replacing the current image. */
  onReplace?: () => void;
  /** Enter the pan/zoom adjust mode. */
  onAdjust?: () => void;
  /** Save the image to the device. */
  onDownload?: () => void;
  /** Send the image back to the Library. */
  onReturnToLibrary?: () => void;
  /** Clear it from this position. */
  onRemove?: () => void;
  /** Empty-position actions. */
  onChooseFile?: () => void;
  onFromUrl?: () => void;
  onSearchOnline?: () => void;
}

const can = (fn?: () => void) => typeof fn === "function";

/** Canonical order for a position that holds an image. */
export const filledImageActions = (h: ImageActionHandlers): PopoverAction[] => [
  ...(can(h.onReplace)
    ? [{ label: "Replace", icon: Upload as LucideIcon, onClick: () => h.onReplace!() }]
    : []),
  ...(can(h.onAdjust)
    ? [{ label: "Crop & Adjust", icon: Crop as LucideIcon, onClick: () => h.onAdjust!() }]
    : []),
  ...(can(h.onDownload)
    ? [{ label: "Download", icon: Download as LucideIcon, onClick: () => h.onDownload!() }]
    : []),
  ...(can(h.onReturnToLibrary)
    ? [
        {
          label: "Return to Library",
          icon: ArrowDownToLine as LucideIcon,
          onClick: () => h.onReturnToLibrary!(),
        },
      ]
    : []),
  ...(can(h.onRemove)
    ? [
        {
          label: "Remove",
          icon: Trash2 as LucideIcon,
          onClick: () => h.onRemove!(),
          variant: "danger" as const,
        },
      ]
    : []),
];

/** Canonical order for a position that is empty. */
export const emptyImageActions = (h: ImageActionHandlers): PopoverAction[] => [
  ...(can(h.onChooseFile)
    ? [{ label: "Choose File", icon: Upload as LucideIcon, onClick: () => h.onChooseFile!() }]
    : []),
  ...(can(h.onFromUrl)
    ? [{ label: "From URL", icon: Globe as LucideIcon, onClick: () => h.onFromUrl!() }]
    : []),
  ...(can(h.onSearchOnline)
    ? [
        {
          label: "Search Online",
          icon: Search as LucideIcon,
          onClick: () => h.onSearchOnline!(),
        },
      ]
    : []),
];
