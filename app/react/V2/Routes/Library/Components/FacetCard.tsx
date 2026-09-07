import React, { useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { checkboxInputClassName } from '#V2/Components/Forms/Checkbox.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';

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

const TreeChildren = ({ children }: { children: ReactNode }) => (
  <div className="relative ps-[2.375rem]">
    <span aria-hidden className="absolute inset-y-1 start-[1.25rem] w-px bg-border" />
    {children}
  </div>
);

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
  <label
    className={`flex cursor-pointer items-center rounded-sm py-1 pe-2 transition-colors hover:bg-warm ${
      child || expandable || reserveGutter ? 'ps-0' : 'ps-2'
    }`}
  >
    {!child && (expandable || reserveGutter) && (
      <span className="me-0.5 flex w-3 shrink-0 items-center justify-start">
        {expandable && (
          <button
            type="button"
            onClick={event => {
              event.preventDefault();
              onExpand?.();
            }}
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
);

type FacetTreeProps = {
  buckets: LibraryFacetBucket[];
  selected: string[];
  onToggle: (id: string) => void;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
};

const FacetTree = ({
  buckets,
  selected,
  onToggle,
  defaultExpanded = false,
  forceExpanded = false,
}: FacetTreeProps) => {
  const groups = buckets.filter(bucket => bucket.id !== 'any');
  const reserveGutter = groups.some(bucket => Boolean(bucket.values?.length));
  const anyBucket = reserveGutter ? buckets.find(bucket => bucket.id === 'any') : undefined;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    defaultExpanded
      ? Object.fromEntries(
          groups.filter(bucket => bucket.values?.length).map(bucket => [bucket.id, true])
        )
      : {}
  );

  return (
    <>
      {groups.map(bucket => {
        const hasChildren = Boolean(bucket.values?.length);
        const isExpanded = forceExpanded || Boolean(expanded[bucket.id]);
        return (
          <React.Fragment key={bucket.id}>
            <FacetRow
              checked={selected.includes(bucket.id)}
              onToggle={() => onToggle(bucket.id)}
              label={bucket.label || bucket.id}
              count={bucket.count}
              bold
              expandable={hasChildren}
              expanded={isExpanded}
              reserveGutter={reserveGutter}
              onExpand={() =>
                setExpanded(current => ({ ...current, [bucket.id]: !current[bucket.id] }))
              }
            />
            {hasChildren && isExpanded && (
              <TreeChildren>
                {bucket.values!.map(child => (
                  <FacetRow
                    key={child.id}
                    child
                    checked={selected.includes(child.id)}
                    onToggle={() => onToggle(child.id)}
                    label={child.label || child.id}
                    count={child.count}
                  />
                ))}
              </TreeChildren>
            )}
          </React.Fragment>
        );
      })}
      {anyBucket && (
        <FacetRow
          checked={selected.includes(anyBucket.id)}
          onToggle={() => onToggle(anyBucket.id)}
          label={<Translate>Any</Translate>}
          count={anyBucket.count}
          bold
          reserveGutter={reserveGutter}
        />
      )}
    </>
  );
};

export { FacetCard, FacetRow, FacetTree, TreeChildren };
export type { FacetCardProps, FacetMode, FacetRowProps, FacetTreeProps };
