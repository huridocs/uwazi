import React, { type ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';

type FacetRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
  count: number;
  icon?: ReactNode;
  child?: boolean;
  bold?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  /** Keep checkboxes in one column when some rows in the card have a chevron. */
  reserveGutter?: boolean;
};

const FacetRow = ({
  checked,
  onToggle,
  label,
  count,
  icon,
  child = false,
  bold = false,
  expandable = false,
  expanded = false,
  onExpand,
  reserveGutter = false,
}: FacetRowProps) => (
  <div
    className={`flex items-center rounded-sm py-1 pe-2 transition-colors hover:bg-warm ${
      child || expandable || reserveGutter ? 'ps-0' : 'ps-2'
    }`}
  >
    {!child && (expandable || reserveGutter) && (
      <span className="me-0.5 flex w-3 shrink-0 items-center justify-start">
        {expandable && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="flex cursor-pointer items-center justify-center rounded text-ink-tertiary hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
          >
            <ChevronDownIcon
              className={`h-3 w-3 transition-transform ${expanded ? '' : '-rotate-90'}`}
            />
          </button>
        )}
      </span>
    )}
    <label className="flex min-w-0 flex-1 cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className={checkboxInputClassName}
      />
      <span className="ms-2.5 flex min-w-0 flex-1 items-center gap-1.5">
        {icon}
        <span className="truncate text-sm text-ink">{label}</span>
      </span>
      <span
        className={`shrink-0 text-sm tabular-nums ${bold ? 'font-bold text-ink' : 'font-normal text-ink-secondary'}`}
      >
        {count}
      </span>
    </label>
  </div>
);

export type { FacetRowProps };
export { FacetRow };
