import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import {
  groupingOptions,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
} from './relationshipsPanelFiltersAtom.js';
import { groupingOptionLabels } from './relationshipsPanelLabels.js';

type RelationshipsGroupByControlProps = {
  axis?: 'primary' | 'secondary';
  disabled?: boolean;
  excludeOption?: RelationshipsPanelGroupBy;
};

const RelationshipsGroupByControl = ({
  axis = 'primary',
  disabled = false,
  excludeOption,
}: RelationshipsGroupByControlProps) => {
  const [groupBy, setGroupBy] = useAtom(relationshipsPanelGroupByAtom);
  const [subGroupBy, setSubGroupBy] = useAtom(relationshipsPanelSubGroupByAtom);
  const value = axis === 'primary' ? groupBy : subGroupBy;
  const setValue = axis === 'primary' ? setGroupBy : setSubGroupBy;
  const [open, setOpen] = useState(false);
  const active = groupingOptions.find(option => option.id === value);
  const labelPrefix =
    axis === 'primary'
      ? t('System', 'Group by:', null, false)
      : t('System', 'Then by:', null, false);
  const visibleOptions = groupingOptions.filter(
    option => option.id === 'none' || option.id !== excludeOption
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(current => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={`flex h-6 items-center gap-1 rounded-md border border-border bg-warm px-2 text-[11px] font-medium transition-colors ${
          disabled
            ? 'cursor-not-allowed text-ink-muted opacity-60'
            : 'cursor-pointer text-ink-secondary hover:bg-parchment hover:text-ink'
        }`}
      >
        <span className="text-ink-tertiary">
          {axis === 'primary' ? <Translate>Group by:</Translate> : <Translate>Then by:</Translate>}
        </span>
        <span>{active && <Translate>{groupingOptionLabels[active.id]}</Translate>}</span>
        <ChevronDownIcon className="h-2.5 w-2.5 text-ink-muted" aria-hidden />
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label={labelPrefix}
            className="absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-md border border-border bg-paper shadow-lg"
          >
            {visibleOptions.map(option => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={value === option.id}
                onClick={() => {
                  if (axis === 'primary' && option.id !== 'none' && subGroupBy === option.id) {
                    setSubGroupBy('none');
                  }
                  setValue(option.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  value === option.id ? 'bg-vellum text-ink' : 'text-ink-secondary hover:bg-warm'
                }`}
              >
                <Translate>{groupingOptionLabels[option.id]}</Translate>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { RelationshipsGroupByControl };
