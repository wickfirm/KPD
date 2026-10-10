"use client";

import { useState, type DragEvent } from "react";
import { reorder } from "@/lib/reorder";

export { reorder };

/// Native drag-and-drop reordering for admin lists. Spread `dropProps(i)` on the
/// card and render `<DragHandle {...handleProps(i)} />` inside it; the handle is
/// the only draggable part so text inputs keep normal selection behaviour.
/// Keyboard users keep the Move up / Move down buttons next to every list.
export function useDragReorder<T>(items: T[], onChange: (items: T[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const end = () => { setDragIndex(null); setOverIndex(null); };
  return {
    dragIndex,
    overIndex,
    handleProps: (index: number) => ({
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        const card = event.currentTarget.closest("[data-reorder-card]");
        if (card) event.dataTransfer.setDragImage(card, 16, 16);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        setDragIndex(index);
      },
      onDragEnd: end,
    }),
    dropProps: (index: number) => ({
      "data-reorder-card": "",
      "data-dragging": dragIndex === index ? "true" : undefined,
      "data-drop-target": overIndex === index && dragIndex !== null && dragIndex !== index ? (dragIndex < index ? "after" : "before") : undefined,
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (dragIndex === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (overIndex !== index) setOverIndex(index);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (dragIndex === null) return;
        event.preventDefault();
        onChange(reorder(items, dragIndex, index));
        end();
      },
    }),
  };
}

export function DragHandle(props: React.HTMLAttributes<HTMLElement> & { draggable?: boolean }) {
  return <span className="cms-drag-handle" role="img" aria-label="Drag to reorder" title="Drag to reorder" {...props}>⠿</span>;
}
