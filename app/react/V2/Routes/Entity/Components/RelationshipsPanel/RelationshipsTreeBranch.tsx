import React, { Children, useState, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { relationshipsPanelZoomAtom } from './relationshipsPanelFiltersAtom.js';
import { useExpandCollapseSignals } from './useExpandCollapseSignals.js';

const RelationshipsTreeNode = ({ children }: { children: ReactNode }) => {
  const zoom = useAtomValue(relationshipsPanelZoomAtom);
  const showDot = zoom === 'overview';

  return (
    <div
      className={[
        'relative pl-5',
        "before:absolute before:bottom-0 before:left-0 before:top-0 before:border-l before:border-border-soft before:content-['']",
        'last:before:bottom-auto last:before:h-[18px]',
        "after:absolute after:left-0 after:top-[18px] after:w-[22px] after:border-t after:border-border-soft after:content-['']",
      ].join(' ')}
    >
      {showDot && (
        <span
          aria-hidden
          className="absolute z-[1] h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
          style={{ left: 0, top: '1.125rem' }}
        />
      )}
      {children}
    </div>
  );
};

type RelationshipsTreeBranchProps = {
  title: ReactNode;
  color?: string;
  count: number;
  markerIds: string[];
  defaultExpanded?: boolean;
  children: ReactNode;
};

const RelationshipsTreeBranch = ({
  title,
  color,
  count,
  markerIds,
  defaultExpanded = true,
  children,
}: RelationshipsTreeBranchProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  useExpandCollapseSignals(setExpanded, markerIds);

  const items = Children.toArray(children);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(current => !current)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-warm/60"
      >
        <ChevronRightIcon
          className={`h-3 w-3 shrink-0 transition-transform ${
            expanded ? 'rotate-90 text-ink-secondary' : 'text-ink-tertiary'
          }`}
          aria-hidden
        />
        {color && <ColorDot color={color} size="md" />}
        <span className="truncate text-sm font-medium text-ink">{title}</span>
        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-ink-tertiary">{count}</span>
      </button>
      {expanded && items.length > 0 && (
        <div className="ml-[14px]">
          {items.map((child, index) => (
            <RelationshipsTreeNode key={index}>{child}</RelationshipsTreeNode>
          ))}
        </div>
      )}
    </div>
  );
};

export { RelationshipsTreeBranch, RelationshipsTreeNode };
