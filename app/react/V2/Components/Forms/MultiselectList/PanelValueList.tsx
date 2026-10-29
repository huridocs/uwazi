import React, { useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { Label } from '../Label.js';
import { checkboxInputClassName } from '../Checkbox.js';
import type { MultiselectListOption } from './MultiselectList.js';

const FOLD = 8;

type Row = {
  value: string;
  label: MultiselectListOption['label'];
  group?: string;
};

type PanelValueListProps = {
  id: string;
  label?: string | React.ReactNode;
  hasErrors: boolean;
  items: MultiselectListOption[] | undefined;
  selections: string[];
  onToggle: (value: string) => void;
  searchTerm: string;
  onSearchTerm: (value: string) => void;
  hideFilters?: boolean;
  noItems: React.ReactNode;
};

const countOf = (items: MultiselectListOption[] | undefined) =>
  (items ?? []).reduce((total, item) => total + (item.items?.length ? item.items.length : 1), 0);

const switchClass = (on: boolean) =>
  `h-7 cursor-pointer whitespace-nowrap rounded-md px-2 text-xs font-medium ${
    on ? 'bg-vellum text-ink' : 'text-ink-tertiary hover:text-ink-secondary'
  }`;

const rowsOf = (items: MultiselectListOption[] | undefined, pinned: Set<string>) => {
  const top: Row[] = [];
  const rest: Row[] = [];
  const push = (row: Row) => (pinned.has(row.value) ? top : rest).push(row);
  (items ?? []).forEach(item => {
    if (item.items?.length) {
      item.items.forEach(child =>
        push({ value: child.value, label: child.label, group: item.searchLabel })
      );
      return;
    }
    push({ value: item.value, label: item.label });
  });
  return [...top, ...rest];
};

const usePanelView = (
  items: MultiselectListOption[] | undefined,
  selections: string[],
  searchTerm: string
) => {
  const [pinned] = useState(() => new Set(selections));
  const [heldView, setHeldView] = useState<ReadonlySet<string> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const totalRef = useRef(0);
  if (!searchTerm.trim()) totalRef.current = countOf(items);
  const rows = rowsOf(items, pinned);
  const inView = heldView
    ? rows.filter(row => heldView.has(row.value) || selections.includes(row.value))
    : rows;
  const shown = heldView || searchTerm.trim() || expanded ? inView : inView.slice(0, FOLD);
  return {
    pinned,
    heldView,
    setHeldView,
    expanded,
    setExpanded,
    long: totalRef.current > FOLD,
    shown,
    hidden: inView.length - shown.length,
    canFold: !heldView && !searchTerm.trim() && inView.length > FOLD,
  };
};

const PanelValueList = ({
  id,
  label,
  hasErrors,
  items,
  selections,
  onToggle,
  searchTerm,
  onSearchTerm,
  hideFilters,
  noItems,
}: PanelValueListProps) => {
  const view = usePanelView(items, selections, searchTerm);
  let lastGroup: string | undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={view.long ? id : undefined} hideLabel={!label} hasErrors={hasErrors}>
        {label}
      </Label>
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-paper">
        {view.long && (
          <div className="flex items-center gap-2 px-1 pt-1">
            <div className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border bg-warm px-2">
              <input
                id={id}
                type="text"
                value={searchTerm}
                placeholder={t('System', 'Search', null, false)}
                onChange={event => onSearchTerm(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <MagnifyingGlassIcon className="h-3 w-3 shrink-0 text-ink-muted" />
            </div>
            {!hideFilters && (
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  aria-pressed={!view.heldView}
                  onClick={() => view.setHeldView(null)}
                  className={switchClass(!view.heldView)}
                >
                  <Translate>All</Translate>
                </button>
                <button
                  type="button"
                  aria-pressed={Boolean(view.heldView)}
                  onClick={() => view.setHeldView(new Set(selections))}
                  className={switchClass(Boolean(view.heldView))}
                >
                  <Translate>Selected</Translate>
                  {` (${selections.length})`}
                </button>
              </div>
            )}
          </div>
        )}
        {view.shown.length === 0 ? (
          <div className="px-3 py-2 text-xs text-ink-muted">{noItems}</div>
        ) : (
          <ul className="px-1 py-1">
            {view.shown.map(row => {
              const lifted = view.pinned.has(row.value);
              const header =
                !lifted && row.group && row.group !== lastGroup ? row.group : undefined;
              if (!lifted) lastGroup = row.group;
              const selected = selections.includes(row.value);
              return (
                <li key={row.value}>
                  {header && (
                    <div className="px-2 pb-0.5 pt-2 text-xs font-semibold text-ink-secondary">
                      {header}
                    </div>
                  )}
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 ${
                      row.group && !lifted ? 'ps-5' : ''
                    } ${selected ? 'bg-carbon/[0.04] hover:bg-carbon/[0.07]' : 'hover:bg-warm'}`}
                  >
                    <input
                      type="checkbox"
                      name={row.value}
                      checked={selected}
                      onChange={() => onToggle(row.value)}
                      className={checkboxInputClassName}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        selected ? 'font-medium text-ink' : 'text-ink-secondary'
                      }`}
                    >
                      {lifted && row.group ? `${row.group} › ` : ''}
                      {typeof row.label === 'string' ? (
                        <Translate>{row.label}</Translate>
                      ) : (
                        row.label
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {view.hidden > 0 && (
          <button
            type="button"
            onClick={() => view.setExpanded(true)}
            className="px-3 py-1.5 text-left text-xs font-medium text-ink-secondary underline underline-offset-2"
          >
            <Translate>Show more</Translate>
            {` (${view.hidden})`}
          </button>
        )}
        {view.expanded && view.canFold && (
          <button
            type="button"
            onClick={() => view.setExpanded(false)}
            className="px-3 py-1.5 text-left text-xs font-medium text-ink-tertiary underline underline-offset-2"
          >
            <Translate>Show less</Translate>
          </button>
        )}
      </div>
    </div>
  );
};

export { PanelValueList };
