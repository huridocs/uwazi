import React, { useState, type ReactNode } from 'react';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import { CollapsibleSectionHeader } from './CollapsibleSectionHeader.js';

type FacetSectionProps = {
  title: ReactNode;
  total: number;
  entries: [string, number][];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  label: (id: string) => string;
  renderMarker?: (id: string) => ReactNode;
  defaultExpanded?: boolean;
  noLabelId?: string;
  noLabelText?: string;
};

const FacetSection = ({
  title,
  total,
  entries,
  selected,
  onToggle,
  label,
  renderMarker,
  defaultExpanded = true,
  noLabelId,
  noLabelText = 'No label',
}: FacetSectionProps) => {
  const [open, setOpen] = useState(defaultExpanded);
  const activeCount = entries.reduce((sum, [id, count]) => sum + (selected[id] ? count : 0), 0);
  const noLabelEntry = noLabelId ? entries.find(([id]) => id === noLabelId) : undefined;
  const regularEntries = noLabelId ? entries.filter(([id]) => id !== noLabelId) : entries;

  return (
    <div className="border-b border-border-soft">
      <CollapsibleSectionHeader
        variant="facet"
        title={title}
        expanded={open}
        onToggle={() => setOpen(current => !current)}
        count={activeCount > 0 ? `${activeCount}/${total}` : total}
      />
      {open && (
        <div className="pb-2">
          {regularEntries.map(([id, count]) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 px-4 py-1.5 transition-colors hover:bg-warm"
            >
              <input
                type="checkbox"
                checked={!!selected[id]}
                onChange={() => onToggle(id)}
                aria-label={label(id)}
                className={checkboxInputClassName}
              />
              {renderMarker?.(id)}
              <span className="flex-1 truncate text-xs text-ink-secondary">{label(id)}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-ink-tertiary">{count}</span>
            </label>
          ))}
          {noLabelEntry && (
            <label className="flex cursor-pointer items-center gap-2 border-t border-border-soft px-4 py-1.5 transition-colors hover:bg-warm">
              <input
                type="checkbox"
                checked={!!selected[noLabelEntry[0]]}
                onChange={() => onToggle(noLabelEntry[0])}
                aria-label={noLabelText}
                className={checkboxInputClassName}
              />
              <span className="flex-1 truncate text-xs italic text-ink-tertiary">
                {noLabelText}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-ink-tertiary">
                {noLabelEntry[1]}
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
};

export { FacetSection };
