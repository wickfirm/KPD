"use client";

import type { ReactNode } from "react";

/// Repeatable-card editor shared by the structured page editors: one card per
/// item with move up / move down / remove, and an add button. Items are plain
/// objects; the parent owns the list and serialises it into a hidden JSON
/// field, so the server action stays a simple FormData read.
export function ListEditor<T extends object>({ items, onChange, newItem, itemLabel, renderItem, addLabel = "Add item", max }: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  itemLabel: (item: T, index: number) => string;
  renderItem: (item: T, update: (changes: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  max?: number;
}) {
  const update = (index: number, changes: Partial<T>) => onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return <div className="cms-list-editor">
    {items.map((item, index) => <fieldset className="cms-repeat-card" key={index}>
      <legend>{itemLabel(item, index)}</legend>
      {renderItem(item, (changes) => update(index, changes), index)}
      <div className="cms-actions">
        <button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => move(index, -1)} disabled={index === 0}>Move up</button>
        <button className="cms-btn cms-btn--ghost cms-btn--small" type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1}>Move down</button>
        <button className="cms-text-button cms-text-button--danger" type="button" onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove</button>
      </div>
    </fieldset>)}
    <button className="cms-btn cms-btn--ghost" type="button" onClick={() => onChange([...items, newItem()])} disabled={max !== undefined && items.length >= max}>{addLabel}</button>
  </div>;
}
