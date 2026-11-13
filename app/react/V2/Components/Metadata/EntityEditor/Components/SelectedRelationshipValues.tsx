import React, { useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { clampItems } from '#V2/Components/Metadata/Components/clampItems.js';
import { EntityOverlayPill } from '#V2/Components/Metadata/Components/EntityOverlayPill.js';
import { ShowAllToggle } from '#V2/Components/Metadata/Components/ShowAllToggle.js';
import type { RelationshipTableRow } from '#V2/Components/Metadata/Components/RelationshipConnectionsTable.js';

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
  const { shown, overflows } = clampItems(sorted, expanded);

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-testid="relationship-connections">
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
        <ShowAllToggle
          expanded={expanded}
          total={sorted.length}
          onToggle={() => setExpanded(current => !current)}
        />
      ) : null}
    </div>
  );
};

export { SelectedRelationshipValues };
