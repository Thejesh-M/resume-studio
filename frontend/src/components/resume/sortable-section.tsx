"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface SortableSectionProps {
  readonly id: string;
  readonly label: string;
  readonly isDragActive: boolean;
  readonly children: ReactNode;
}

export function SortableSection({ id, label, isDragActive, children }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  // While this item is being dragged, collapse it to a thin placeholder
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="my-1 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 select-none"
      >
        <span className="text-xs font-medium text-primary/50">{label}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative${isDragActive ? " select-none" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-3 z-10 flex h-8 w-6 cursor-grab items-center justify-center rounded-sm select-none opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 active:cursor-grabbing"
        aria-label={`Drag to reorder ${label} section`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="pl-5">{children}</div>
    </div>
  );
}

/** Compact overlay shown at the cursor while dragging. */
export function SectionDragOverlay({ label }: { readonly label: string }) {
  return (
    <div className="flex w-56 items-center gap-2 rounded-lg border border-primary/20 bg-background px-3 py-2.5 shadow-lg ring-1 ring-primary/10 select-none">
      <GripVertical className="h-4 w-4 shrink-0 text-primary/40" />
      <span className="truncate text-sm font-medium">{label}</span>
    </div>
  );
}
