import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { copyFromMatchingProperties } from './copyFromMatchingProperties.js';

type CopyFromSearchViewProps = {
  query: string;
  onQueryChange: (value: string) => void;
  sameTypeOnly: boolean;
  onSameTypeOnlyChange: (value: boolean) => void;
  currentTemplate?: Template;
  currentTemplateId?: string;
  templates: Template[];
  results: Entity[];
  isSearching: boolean;
  onSelect: (entity: Entity) => void;
};

const typeChipClass = (active: boolean) =>
  [
    'shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
    active ? 'bg-warm text-ink' : 'border border-border bg-paper text-ink-secondary hover:bg-warm',
  ].join(' ');

const CopyFromSearchView = ({
  query,
  onQueryChange,
  sameTypeOnly,
  onSameTypeOnlyChange,
  currentTemplate,
  currentTemplateId,
  templates,
  results,
  isSearching,
  onSelect,
}: CopyFromSearchViewProps) => (
  <>
    <div className="flex items-center gap-2 px-5 py-3">
      <div className="min-w-0 flex-1">
        <InputField
          id="copy-from-search"
          type="search"
          hideLabel
          label={t('System', 'Search by title', null, false)}
          placeholder={t('System', 'Search by title', null, false)}
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          icon={<MagnifyingGlassIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />}
          clearFieldAction={query ? () => onQueryChange('') : undefined}
        />
      </div>
      {currentTemplate ? (
        <button
          type="button"
          className={typeChipClass(sameTypeOnly)}
          onClick={() => onSameTypeOnlyChange(true)}
        >
          <Translate context={currentTemplate._id}>{currentTemplate.name}</Translate>
        </button>
      ) : null}
      <button
        type="button"
        className={typeChipClass(!sameTypeOnly)}
        onClick={() => onSameTypeOnlyChange(false)}
      >
        <Translate>Any type</Translate>
      </button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" data-testid="copy-from-results">
      {isSearching ? (
        <p className="px-3 py-8 text-center text-sm text-ink-secondary">
          <Translate>Searching...</Translate>
        </p>
      ) : null}
      {!isSearching &&
        results.map(entity => {
          const fieldCount = copyFromMatchingProperties(
            templates,
            currentTemplateId,
            entity.template
          ).length;
          return (
            <button
              key={entity.sharedId}
              type="button"
              aria-label={entity.title}
              onClick={() => onSelect(entity)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-warm"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{entity.title}</span>
                <span className="mt-1 block">
                  <TemplateLabel templateId={entity.template} />
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-warm px-2 py-0.5 text-micro text-ink-tertiary">
                {fieldCount} <Translate>{fieldCount === 1 ? 'field' : 'fields'}</Translate>
              </span>
            </button>
          );
        })}
      {!isSearching && results.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-ink-muted">
          <Translate>No results found</Translate>
        </p>
      ) : null}
    </div>
    <div className="border-t border-border px-5 py-2 text-xs text-ink-tertiary">
      {results.length} <Translate>{results.length === 1 ? 'candidate' : 'candidates'}</Translate>
    </div>
  </>
);

export { CopyFromSearchView };
export type { CopyFromSearchViewProps };
