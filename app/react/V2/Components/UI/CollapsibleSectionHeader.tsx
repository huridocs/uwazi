import React, { type ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ColorDot } from './ColorDot.js';

type CollapsibleSectionHeaderVariant = 'facet' | 'group' | 'tree';

type CollapsibleSectionHeaderProps = {
  title: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  count?: ReactNode;
  color?: string;
  variant: CollapsibleSectionHeaderVariant;
};

const buttonClass: Record<CollapsibleSectionHeaderVariant, string> = {
  facet:
    'flex w-full min-w-0 cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-left transition-colors hover:bg-warm',
  group:
    'flex w-full min-w-0 items-center gap-2 border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-warm',
  tree: 'flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded border-0 bg-transparent px-2 py-1.5 text-left transition-colors hover:bg-warm/60',
};

const titleClass: Record<CollapsibleSectionHeaderVariant, string> = {
  facet: 'min-w-0 flex-1 truncate text-left text-xs font-semibold text-ink-secondary',
  group: 'min-w-0 flex-1 truncate text-left text-sm font-medium text-ink',
  tree: 'min-w-0 flex-1 truncate text-left text-sm font-medium text-ink',
};

const countClass: Record<CollapsibleSectionHeaderVariant, string> = {
  facet: 'shrink-0 text-[11px] tabular-nums text-ink-tertiary',
  group: 'shrink-0 rounded bg-warm px-1.5 text-[10px] font-semibold tabular-nums text-ink-tertiary',
  tree: 'shrink-0 text-[11px] tabular-nums text-ink-tertiary',
};

const CollapsibleSectionHeader = ({
  title,
  expanded,
  onToggle,
  count,
  color,
  variant,
}: CollapsibleSectionHeaderProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={variant === 'tree' ? expanded : undefined}
    className={buttonClass[variant]}
  >
    {variant === 'tree' ? (
      <ChevronRightIcon
        className={`h-3 w-3 shrink-0 transition-transform ${
          expanded ? 'rotate-90 text-ink-secondary' : 'text-ink-tertiary'
        }`}
        aria-hidden
      />
    ) : (
      <ChevronDownIcon
        className={`${variant === 'group' ? 'h-3.5 w-3.5 text-ink-muted' : 'h-3 w-3 text-ink-tertiary'} shrink-0 transition-transform ${
          expanded ? '' : '-rotate-90'
        }`}
        aria-hidden
      />
    )}
    {color && <ColorDot color={color} size="md" />}
    <span className={titleClass[variant]}>{title}</span>
    {count !== undefined && count !== null && <span className={countClass[variant]}>{count}</span>}
  </button>
);

export type { CollapsibleSectionHeaderVariant };
export { CollapsibleSectionHeader };
