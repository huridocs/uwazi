import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { useExpandCollapseSignals } from './useExpandCollapseSignals.js';

type RelationshipGroupedCardProps = {
  title: ReactNode;
  color?: string;
  count: number;
  markerIds: string[];
  children: ReactNode;
};

const RelationshipGroupedCard = ({
  title,
  color,
  count,
  markerIds,
  children,
}: RelationshipGroupedCardProps) => {
  const [expanded, setExpanded] = useState(false);
  useExpandCollapseSignals(setExpanded, markerIds);

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-paper">
      <button
        type="button"
        onClick={() => setExpanded(current => !current)}
        className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-warm"
      >
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${
            expanded ? '' : '-rotate-90'
          }`}
          aria-hidden
        />
        {color && <ColorDot color={color} size="md" />}
        <span className="truncate text-sm font-medium text-ink">{title}</span>
        <span className="ml-auto shrink-0 rounded bg-warm px-1.5 text-[10px] font-semibold tabular-nums text-ink-tertiary">
          {count}
        </span>
      </button>
      {expanded && <div className="border-t border-border/40">{children}</div>}
    </div>
  );
};

export { RelationshipGroupedCard };
