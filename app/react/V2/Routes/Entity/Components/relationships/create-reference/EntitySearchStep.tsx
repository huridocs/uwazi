import React from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { Modal } from '#V2/Components/UI/index.js';

type EntitySearchStepProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  isSearching: boolean;
  hasSearched: boolean;
  groupedResults: Map<string, Entity[]>;
  searchResults: Entity[];
  templateName: (templateId: string) => string;
  onStartNewEntity: () => void;
  onEntitySelect: (entity: Entity) => void;
};

const EntitySearchStep = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  hasSearched,
  groupedResults,
  searchResults,
  templateName,
  onStartNewEntity,
  onEntitySelect,
}: EntitySearchStepProps) => (
  <>
    <div className="border-b border-border/50 px-5 py-3">
      <InputField
        id="create-relationship-search"
        type="search"
        label={t('System', 'Search entities...', null, false)}
        placeholder={t('System', 'Search entities...', null, false)}
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
        hideLabel
        icon={<MagnifyingGlassIcon className="h-5 w-5 text-ink-muted" aria-hidden="true" />}
        clearFieldAction={() => setSearchQuery('')}
      />
    </div>
    <Modal.Body className="space-y-4">
      <button
        type="button"
        onClick={onStartNewEntity}
        className="flex w-full items-center gap-2.5 rounded-md border border-dashed border-border px-3 py-2 text-left transition-colors hover:border-ink/30 hover:bg-warm"
      >
        <PlusIcon className="h-4 w-4 shrink-0 text-ink-muted" />
        <span className="text-sm text-ink-secondary">
          <Translate>Create new entity from selection</Translate>
        </span>
      </button>

      {isSearching && (
        <p className="py-8 text-center text-sm text-ink-secondary">
          <Translate>Searching...</Translate>
        </p>
      )}

      {!isSearching &&
        hasSearched &&
        Array.from(groupedResults.entries()).map(([templateId, entities]) => (
          <div key={templateId}>
            <h4 className="mb-2 text-micro font-medium uppercase tracking-wider text-ink-muted">
              {templateName(templateId)}
            </h4>
            <div className="space-y-1">
              {entities.map(result => (
                <button
                  key={result._id}
                  type="button"
                  onClick={() => onEntitySelect(result)}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-warm"
                >
                  <span className="text-sm text-ink">{result.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

      {!isSearching && hasSearched && searchResults.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-muted">
          <Translate>No results found</Translate>
        </p>
      )}
    </Modal.Body>
  </>
);

export { EntitySearchStep };
