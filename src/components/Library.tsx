import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, LayoutGrid, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
import { PROJECT_TYPES, projectTypeMeta } from "@/constants/projectTypes";
import { Rank, ProjectType } from "@/types";

interface LibraryProps {
  isOpen: boolean;
  onClose: () => void;
  ranks: Rank[];
  activeRankId: string;
  onSelectRank: (id: string) => void;
  onDeleteRank: (id: string) => void;
  onNewRank: (type: ProjectType) => void;
  onUpdateRank: (id: string, updates: Partial<Rank>) => void;
}

/** The projects sheet. The row order is frozen while it is open so renaming a
 *  project cannot send it to the top of the list mid-edit. */
export const Library: React.FC<LibraryProps> = ({
  isOpen,
  onClose,
  ranks,
  activeRankId,
  onSelectRank,
  onDeleteRank,
  onNewRank,
  onUpdateRank,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(
    null
  );
  const [frozenOrder, setFrozenOrder] = useState<string[]>([]);
  const editRef = useRef<HTMLInputElement>(null);

  // Read through a ref so the freeze effect does not depend on `ranks`.
  const ranksRef = useRef(ranks);
  ranksRef.current = ranks;

  // Capture the order once per opening, so renaming cannot reorder the list.
  useEffect(() => {
    setEditingId(null);
    setMenu(null);
    if (!isOpen) return;
    setFrozenOrder(
      [...ranksRef.current]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((r) => r.id)
    );
  }, [isOpen]);

  const sorted = useMemo(() => {
    const byId = new Map(ranks.map((r) => [r.id, r]));
    const known = frozenOrder
      .map((id) => byId.get(id))
      .filter((r): r is Rank => Boolean(r));
    const seen = new Set(frozenOrder);
    const added = ranks
      .filter((r) => !seen.has(r.id))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return [...known, ...added];
  }, [ranks, frozenOrder]);

  const startEditing = (rank: Rank) => {
    setMenu(null);
    setEditingId(rank.id);
    setEditTitle(rank.title);
    requestAnimationFrame(() => editRef.current?.select());
  };

  const commitEditing = () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (title) onUpdateRank(editingId, { title });
    setEditingId(null);
  };

  const canDelete = ranks.length > 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Projects"
      className="max-w-xl"
      contentClassName="p-0 flex flex-col min-h-0"
      headerAction={
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          className="px-3 h-9 rounded-control text-body font-semibold text-primary
                     hover:bg-hover transition-colors duration-150"
        >
          Done
        </motion.button>
      }
    >
      <div className="flex-1 overflow-y-auto scrollbar-ios min-h-0 px-4 pt-4 pb-6">
        {/* ── New project ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {PROJECT_TYPES.map(({ type, label, hint, icon: Icon, tint }, i) => (
            <motion.button
              key={type}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 520,
                damping: 36,
                delay: i * 0.02,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onNewRank(type);
                onClose();
              }}
              className="group flex flex-col items-center gap-2 px-2 py-4 rounded-card
                         material-card hover:bg-hover transition-colors duration-150 text-center"
            >
              <span
                className="grid place-items-center w-9 h-9 rounded-chip squircle
                           transition-transform duration-200 ease-spring
                           group-hover:scale-110 group-active:scale-95"
                style={{
                  backgroundColor: `color-mix(in srgb, ${tint} 18%, transparent)`,
                  color: tint,
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="flex flex-col gap-0.5 min-w-0 w-full">
                <span className="text-subheadline font-semibold text-text leading-tight">
                  {label}
                </span>
                <span className="text-caption-1 text-muted leading-tight">
                  {hint}
                </span>
              </span>
            </motion.button>
          ))}
        </div>

        <span className="mt-6 mb-2 block pl-4 text-footnote font-medium text-muted uppercase tracking-wide">
          Projects
        </span>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted gap-3">
            <LayoutGrid size={36} strokeWidth={1.2} className="opacity-50" />
            <span className="text-subheadline">No projects yet</span>
          </div>
        ) : (
          /* `overflow-hidden` keeps the row hover highlight inside the card's
             radius instead of squaring off its corners. */
          <ul className="material-card rounded-card overflow-hidden">
            <AnimatePresence initial={false}>
              {sorted.map((rank, i) => {
                const meta = projectTypeMeta(rank.type);
                const Icon = meta.icon;
                const isActive = rank.id === activeRankId;
                const isEditing = editingId === rank.id;

                return (
                  <motion.li
                    key={rank.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 540,
                      damping: 38,
                      delay: Math.min(i, 6) * 0.02,
                    }}
                    className="group/row relative flex items-stretch
                               transition-colors duration-150
                               hover:bg-hover focus-within:bg-hover"
                    style={
                      i < sorted.length - 1
                        ? {
                            borderBottom: "0.5px solid var(--material-hairline)",
                          }
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) return;
                        onSelectRank(rank.id);
                        onClose();
                      }}
                      aria-current={isActive || undefined}
                      className="flex-1 min-w-0 flex items-center gap-3 pl-3 pr-2 py-3 text-left"
                    >
                      <span
                        className="grid place-items-center w-8 h-8 rounded-chip squircle shrink-0"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${meta.tint} 18%, transparent)`,
                          color: meta.tint,
                        }}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </span>

                      <span className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            ref={editRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={commitEditing}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditing();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Project name"
                            className="w-full h-7 px-2 rounded-chip bg-background text-text
                                       text-subheadline font-semibold outline-none
                                       focus-visible:focus-ring"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate text-subheadline font-semibold text-text">
                              {rank.title}
                            </span>
                            {isActive && (
                              <motion.span
                                layoutId="active-project-tick"
                                transition={{
                                  type: "spring",
                                  stiffness: 520,
                                  damping: 34,
                                }}
                                className="grid place-items-center w-4 h-4 rounded-full shrink-0"
                                style={{ backgroundColor: "var(--color-accent-blue)" }}
                              >
                                <Check size={10} strokeWidth={3.4} color="#fff" />
                              </motion.span>
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-caption-1 text-muted mt-0.5">
                          <span>{meta.label}</span>
                          <span aria-hidden>·</span>
                          <span>
                            {new Date(rank.updatedAt).toLocaleDateString()}
                          </span>
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Options for ${rank.title}`}
                      aria-haspopup="menu"
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setMenu({
                          id: rank.id,
                          x: r.left + r.width / 2,
                          y: r.bottom + 4,
                        });
                      }}
                      className={`shrink-0 grid place-items-center w-11 transition-colors duration-150
                                  ${
                                    menu?.id === rank.id
                                      ? "text-text"
                                      : "text-muted group-hover/row:text-text"
                                  }`}
                    >
                      <MoreHorizontal size={17} strokeWidth={2.2} />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* One menu, anchored to whichever row was asked for. */}
      <PopoverMenu
        isOpen={!!menu}
        onClose={() => setMenu(null)}
        triggerPoint={menu ? { x: menu.x, y: menu.y } : null}
        actions={[
          {
            label: "Rename",
            icon: Pencil,
            onClick: () => {
              const rank = ranks.find((r) => r.id === menu?.id);
              if (rank) startEditing(rank);
            },
          },
          {
            label: canDelete ? "Delete" : "Can't delete the last project",
            icon: Trash2,
            variant: "danger",
            onClick: () => {
              if (canDelete && menu) onDeleteRank(menu.id);
            },
          },
        ]}
      />
    </Modal>
  );
};
