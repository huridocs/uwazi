import React, { type ReactNode } from 'react';

type FacetMode = 'and' | 'or';

type FacetCardProps = {
  children: ReactNode;
  title?: ReactNode;
  open?: boolean;
  headerAction?: ReactNode;
  /** Design KeywordFacetCard: `space-y-1.5` (6px) between header and body. */
  stacked?: boolean;
};

const FacetCard = ({
  children,
  title,
  open = true,
  headerAction,
  stacked = false,
}: FacetCardProps) => (
  <div
    className={`rounded-lg border border-border/60 bg-paper p-1.5 ${stacked ? 'space-y-1.5' : ''}`}
  >
    {(title || headerAction) && (
      <div
        className={`flex items-center justify-between gap-2 px-2 pt-1 ${stacked ? '' : 'pb-0.5'}`}
      >
        {title && <div className="min-w-0 truncate text-tab font-bold text-ink">{title}</div>}
        {headerAction}
      </div>
    )}
    {open ? children : null}
  </div>
);

export { FacetRow } from './FacetRow.js';
export { TreeChildren } from './TreeChildren.js';
export { FacetTree } from './FacetTree.js';
export type { FacetRowProps } from './FacetRow.js';
export type { FacetTreeProps } from './FacetTree.js';
export { FacetCard };
export type { FacetCardProps, FacetMode };
