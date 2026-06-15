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
    'flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 transition-colors hover:bg-warm',
  group: 'flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-warm',
  tree: 'flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-warm/60',
};

const titleClass: Record<CollapsibleSectionHeaderVariant, string> = {
  facet: 'text-xs font-semibold text-ink-secondary',
  group: 'truncate text-sm font-medium text-ink',
  tree: 'truncate text-sm font-medium text-ink',
};

const countClass: Record<CollapsibleSectionHeaderVariant, string> = {
  facet: 'ml-auto text-[11px] tabular-nums text-ink-tertiary',
  group:
    'ml-auto shrink-0 rounded bg-warm px-1.5 text-[10px] font-semibold tabular-nums text-ink-tertiary',
  tree: 'ml-auto shrink-0 text-[11px] tabular-nums text-ink-tertiary',
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
