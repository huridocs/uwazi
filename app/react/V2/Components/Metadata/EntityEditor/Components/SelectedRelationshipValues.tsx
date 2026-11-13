import React, { useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { EntityOverlayPill } from '#V2/Components/Metadata/Components/EntityOverlayPill.js';
import type { RelationshipTableRow } from '#V2/Components/Metadata/Components/RelationshipConnectionsTable.js';

const SHOWN_COUNT = 10;
const titleCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

type SelectedRelationshipValuesProps = {
  rows: RelationshipTableRow[];
  targetTemplateId?: string;
  disabled: boolean;
  onRemove: (entityId: string) => void;
  onEditSource?: (entityId: string, label: string) => void;
};

const SelectedRelationshipValues = ({
  rows,
  targetTemplateId,
  disabled,
  onRemove,
  onEditSource,
}: SelectedRelationshipValuesProps) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(
    () => [...rows].sort((left, right) => titleCollator.compare(left.label, right.label)),
    [rows]
  );
  const overflows = sorted.length > SHOWN_COUNT;
  const shown = !overflows || expanded ? sorted : sorted.slice(0, SHOWN_COUNT);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
        {shown.map(row => (
          <li key={row.id} className="flex min-w-0 max-w-full items-center gap-0.5">
            <span className="min-w-0">
              <EntityOverlayPill
                sharedId={row.id}
                templateId={row.templateId || targetTemplateId || ''}
                label={row.label || row.id}
                icon={row.icon}
                authorized={row.authorized}
                onOpenEntity={
                  onEditSource
                    ? () => {
                        onEditSource(row.id, row.label);
                      }
                    : undefined
                }
              />
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(row.id)}
              title={t('System', 'Remove from connection', null, false)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-ink-muted hover:bg-warm hover:text-seal disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {overflows ? (
        <button
          type="button"
          aria-expanded={expanded}
          className="self-start text-xs font-medium text-ink-secondary underline underline-offset-2 hover:text-ink"
          onClick={() => setExpanded(current => !current)}
        >
          {expanded ? (
            <Translate>Show less</Translate>
          ) : (
            <>
              <Translate>Show all</Translate>
              {` ${sorted.length}`}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
};

export { SelectedRelationshipValues };
