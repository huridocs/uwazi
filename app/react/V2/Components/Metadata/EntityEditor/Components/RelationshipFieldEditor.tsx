import React, { useMemo, useState } from 'react';
import {
  InformationCircleIcon,
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { CompactSearchInput } from '#V2/Components/Forms/CompactSearchInput.js';
import { RelationCaption } from '#V2/Components/Metadata/Components/RelationCaption.js';
import {
  RelationshipConnectionsTable,
  type RelationshipTableRow,
} from '#V2/Components/Metadata/Components/RelationshipConnectionsTable.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';
import type { InheritColumn } from '../../relationshipInherit.js';
import { EntityFieldLabel } from '../functions/fieldErrorState.js';
import {
  RelationshipCandidateList,
  useRelationshipCandidates,
  type RelationshipCandidateSearch,
} from './RelationshipCandidateList.js';

type RelationshipFieldEditorProps = {
  title: string;
  translationContext?: string;
  relationLabel?: string;
  targetTemplateId?: string;
  values: MetadataValue[];
  onChange: (values: MetadataValue[]) => void;
  columns?: InheritColumn[];
  lookupSearch?: RelationshipCandidateSearch;
  onEditSource?: (entityId: string, label: string) => void;
  disabled?: boolean;
  searchId?: string;
  showError?: boolean;
};

const RelationshipFieldEditor = ({
  title,
  translationContext = 'System',
  relationLabel,
  targetTemplateId,
  values,
  onChange,
  columns = [],
  lookupSearch,
  onEditSource,
  disabled = false,
  searchId,
  showError = false,
}: RelationshipFieldEditorProps) => {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');

  const selectedIds = useMemo(
    () => values.map(value => String(value.value ?? '')).filter(Boolean),
    [values]
  );

  const rows: RelationshipTableRow[] = useMemo(
    () =>
      values.map(row => ({
        id: String(row.value ?? ''),
        label: row.label ?? String(row.value ?? ''),
        templateId: targetTemplateId,
      })),
    [targetTemplateId, values]
  );

  const { candidates, fetched, loadMore, reset, setShowAll, showAll, total } =
    useRelationshipCandidates({
      lookupSearch,
      selectedIds,
      adding,
      query,
    });

  const addEntity = (option: MultiselectListOption) => {
    const label = typeof option.label === 'string' ? option.label : option.searchLabel;
    onChange([
      ...values,
      {
        value: option.value,
        label,
        type: 'entity',
      },
    ]);
    setQuery('');
    setAdding(false);
    reset();
  };

  const removeEntity = (entityId: string) => {
    onChange(values.filter(value => String(value.value ?? '') !== entityId));
  };

  return (
    <div className="space-y-1.5">
      <div>
        <div className="flex items-center gap-1.5">
          <LinkIcon className="h-3.5 w-3.5 shrink-0 text-carbon" aria-hidden />
          <EntityFieldLabel context={translationContext} label={title} showError={showError} />
        </div>
        {relationLabel ? (
          <RelationCaption
            relationLabel={relationLabel}
            inheritLabels={columns.map(column => column.label)}
          />
        ) : null}
      </div>

      <RelationshipConnectionsTable
        rows={rows}
        columns={columns}
        translationContext={translationContext}
        targetTemplateId={targetTemplateId}
        renderActions={row => (
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              disabled={disabled || !onEditSource}
              onClick={() => onEditSource?.(row.id, row.label)}
              title={t('System', 'Edit at source', null, false)}
              className="flex h-6 cursor-pointer items-center gap-1 rounded px-1.5 text-[11px] font-medium text-ink-secondary transition-colors hover:bg-warm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PencilSquareIcon className="h-3 w-3" aria-hidden />
              <Translate>Source</Translate>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeEntity(row.id)}
              title={t('System', 'Remove from connection', null, false)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-ink-muted transition-colors hover:bg-warm hover:text-seal disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
      />

      {adding ? (
        <div className="overflow-hidden rounded-md border border-border">
          <CompactSearchInput
            id={searchId}
            autoFocus
            value={query}
            disabled={disabled}
            placeholder={t('System', 'Search entities…', null, false)}
            onChange={setQuery}
          />
          <RelationshipCandidateList
            candidates={candidates}
            disabled={disabled}
            expanded={showAll}
            fetched={fetched}
            targetTemplateId={targetTemplateId}
            total={total}
            onAdd={addEntity}
            onLoadMore={loadMore}
            onToggle={() => setShowAll(current => !current)}
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setQuery('');
            setShowAll(false);
            setAdding(true);
          }}
          className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-warm px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden />
          <Translate>Add entity</Translate>
        </button>
      )}

      {columns.length > 0 ? (
        <p className="flex items-start gap-1.5 text-[11px] text-ink-tertiary">
          <InformationCircleIcon className="mt-px h-3 w-3 shrink-0 text-carbon" aria-hidden />
          <Translate>
            Inherited values are read-only. Change the connection above, or edit the source entity.
          </Translate>
        </p>
      ) : null}
    </div>
  );
};

export { RelationshipFieldEditor };
export type { RelationshipFieldEditorProps };
