import React, { type ReactNode } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';

type FacetCardProps = {
  children: ReactNode;
  title?: ReactNode;
  open?: boolean;
};

const FacetCard = ({ children, title, open = true }: FacetCardProps) => (
  <div className="rounded-lg border border-border/60 bg-paper p-1.5">
    {title && <div className="px-2 pt-1 pb-0.5 text-sm font-bold text-ink">{title}</div>}
    {open ? children : null}
  </div>
);

type FacetRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
  count: number;
  icon?: ReactNode;
  indent?: boolean;
  bold?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
};

const rowPadding = ({ indent, expandable }: { indent: boolean; expandable: boolean }) => {
  if (indent) {
    return 'ps-10';
  }
  if (expandable) {
    return 'ps-1';
  }
  return 'ps-2';
};

const FacetRow = ({
  checked,
  onToggle,
  label,
  count,
  icon,
  indent = false,
  bold = false,
  expandable = false,
  expanded = false,
  onExpand,
}: FacetRowProps) => (
  <label
    className={`flex cursor-pointer items-center rounded-sm py-1 pe-2 transition-colors hover:bg-warm ${rowPadding({ indent, expandable })}`}
  >
    {expandable && !indent && (
      <button
        type="button"
        onClick={event => {
          event.preventDefault();
          onExpand?.();
        }}
        aria-label={expanded ? 'Collapse' : 'Expand'}
        className="me-1 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded text-ink-tertiary hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
      >
        <ChevronRightIcon
          className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
    )}
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      className={checkboxInputClassName}
    />
    <span className="ms-2.5 flex min-w-0 flex-1 items-center gap-1.5">
      {icon}
      <span className={`truncate text-sm ${bold ? 'text-ink' : 'text-ink-secondary'}`}>
        {label}
      </span>
    </span>
    <span
      className={`shrink-0 text-sm tabular-nums ${bold ? 'font-bold text-ink' : 'font-medium text-ink-tertiary'}`}
    >
      {count}
    </span>
  </label>
);

export { FacetCard, FacetRow };
export type { FacetCardProps, FacetRowProps };
