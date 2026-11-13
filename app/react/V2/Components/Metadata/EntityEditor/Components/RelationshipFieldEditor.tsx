import React, { useMemo, useState } from 'react';
import {
  InformationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { CompactSearchInput } from '#V2/Components/Forms/CompactSearchInput.js';
import { Tooltip } from '#V2/Components/UI/index.js';
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
  onClear?: () => void;
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
  onClear,
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
  const inheritedValuesHint =
    columns.length > 0
      ? t(
          'System',
          'Inherited values are read-only. Change the connection above, or edit the source entity.',
          null,
          false
        )
      : '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <EntityFieldLabel context={translationContext} label={title} showError={showError} />
          {relationLabel ? (
            <RelationCaption relationLabel={relationLabel} fieldTitle={title} />
          ) : null}
        </div>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            data-testid="clear-field-button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:cursor-pointer focus:outline-hidden enabled:hover:text-ink-secondary disabled:opacity-50"
          >
            <XMarkIcon className="h-3.5 w-3.5 text-ink-muted" />
            <Translate className="sr-only">Clear</Translate>
          </button>
        ) : null}
      </div>

      <RelationshipConnectionsTable
        rows={rows}
        columns={columns}
        translationContext={translationContext}
        targetTemplateId={targetTemplateId}
        preview
        renderActions={row => (
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              disabled={disabled || !onEditSource}
              onClick={() => onEditSource?.(row.id, row.label)}
              title={t('System', 'Edit at source', null, false)}
              className="flex h-6 cursor-pointer items-center gap-1 rounded px-1.5 text-meta font-medium text-ink-secondary transition-colors hover:bg-warm disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="flex items-center">
        {adding ? (
          <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border">
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
            className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-warm text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 ${inheritedValuesHint ? 'pl-2.5 pr-1' : 'px-2.5'}`}
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden />
            <Translate>Add entity</Translate>
          </button>
        )}
        {inheritedValuesHint ? (
          <Tooltip content={inheritedValuesHint} placement="top" size="nano">
            <button
              type="button"
              className="-ml-0.5 flex h-7 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-tertiary hover:bg-warm hover:text-ink"
              aria-label={inheritedValuesHint}
            >
              <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
};

export { RelationshipFieldEditor };
export type { RelationshipFieldEditorProps };
