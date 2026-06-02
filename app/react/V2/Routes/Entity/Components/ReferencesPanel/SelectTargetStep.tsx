import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from '#app/I18N/index.js';
import { ClientRelationshipType } from '#app/apiResponseTypes.js';
import { FileType } from '#shared/types/fileType.js';
import { Card, BlankState } from '#V2/Components/UI/index.js';
import { InputField, Checkbox } from '#V2/Components/Forms/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { EntitySearchResult } from './EntitySearchResult.js';
import { ReferenceMode } from './useCreateReferenceState.js';

type SelectTargetStepProps = {
  relationshipTypes: ClientRelationshipType[];
  selectedRelationshipType: string | undefined;
  searchQuery: string;
  searchResults: Entity[];
  isSearching: boolean;
  hasSearched: boolean;
  selectedEntity: Entity | undefined;
  selectedFile: FileType | undefined;
  mode: ReferenceMode;
  onRelationshipTypeToggle: (id: string) => void;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onEntitySelect: (entity: Entity) => void;
  onFileSelect: (file: FileType) => void;
};

const SelectTargetStep = ({
  relationshipTypes,
  selectedRelationshipType,
  searchQuery,
  searchResults,
  isSearching,
  hasSearched,
  selectedEntity,
  selectedFile,
  mode,
  onRelationshipTypeToggle,
  onSearchInputChange,
  onClearSearch,
  onEntitySelect,
  onFileSelect,
}: SelectTargetStepProps) => (
  <div className="flex flex-col gap-2 h-full min-h-0">
    <div className="shrink flex flex-col overflow-hidden max-h-[40%]">
      <Card
        title={<Translate>Relationship type</Translate>}
        className="flex flex-col overflow-hidden h-full"
        color="black"
      >
        <div className="flex flex-col gap-0.5 flex-1 min-h-0 h-full">
          {relationshipTypes.length > 0 ? (
            relationshipTypes.map(relationshipType => (
              <Checkbox
                key={relationshipType._id}
                name={relationshipType._id}
                checked={selectedRelationshipType === relationshipType._id}
                onChange={() => onRelationshipTypeToggle(relationshipType._id)}
                label={relationshipType.name}
                className="hover:bg-gray-50 p-2 rounded-md transition-colors"
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">
              <Translate>No relationship types available</Translate>
            </p>
          )}
        </div>
      </Card>
    </div>

    <div className="flex flex-col gap-2 flex-1 min-h-0 grow">
      <InputField
        id="entity-search"
        type="search"
        placeholder={t('System', 'Search', null, false)}
        value={searchQuery}
        onChange={onSearchInputChange}
        hideLabel
        icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
        clearFieldAction={onClearSearch}
      />

      {hasSearched && (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Translate>Searching...</Translate>
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {searchResults.map(entity => (
                <EntitySearchResult
                  key={entity._id}
                  entity={entity}
                  onClick={() => onEntitySelect(entity)}
                  isSelected={selectedEntity?._id === entity._id}
                  mode={mode}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                />
              ))}
            </div>
          )}
          {!isSearching && searchResults.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <BlankState
                icon={
                  <MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
                }
                title={<Translate>No results found</Translate>}
                description={
                  <Translate>Try adjusting your search terms or check for typos</Translate>
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

export { SelectTargetStep };
