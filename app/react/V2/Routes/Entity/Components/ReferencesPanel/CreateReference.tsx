import React, { useState, useCallback, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from 'app/I18N';
import { Panel } from 'V2/Components/Layouts/Panel';
import { useAtomValue, useSetAtom } from 'jotai';
import { relationshipTypesAtom } from 'V2/atoms';
import { Entity } from 'V2/domain';
import * as searchAPI from 'V2/api/search';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { getTextColor } from 'V2/Components/Metadata/TemplateLabel';
import { BlankState } from '../BlankState';
import { createReferenceSelectionAtom } from './referencesAtom';

type CreateReferenceProps = {
  selection: TextSelection;
  onCancel?: () => void;
};

const EntitySearchResult = ({ entity, onClick }: { entity: Entity; onClick: () => void }) => {
  const templateName = entity.template?.name || '';
  const templateColor = entity.template?.color || '#A4CAFE';
  const templateLabel = entity.template?.label || templateName;

  // Format date - try to get creationDate or editDate
  const dateProperty = entity.creationDate || entity.editDate;
  const dateValue = dateProperty?.values?.[0]?.value;
  let formattedDate = '';
  if (dateValue) {
    try {
      const timestamp = typeof dateValue === 'number' ? dateValue : dateValue;
      formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      // Invalid date, leave empty
    }
  }

  const textColor = useMemo(() => getTextColor(templateColor), [templateColor]);

  return (
    <div
      className="border border-gray-100 rounded-xl shadow-sm p-4 bg-white flex flex-col gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{entity.title || '-'}</h3>
          {formattedDate && <p className="text-xs text-gray-600 mt-1">{formattedDate}</p>}
        </div>
        {templateLabel && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-sm flex-shrink-0"
            style={{ backgroundColor: templateColor, color: textColor }}
          >
            {templateLabel}
          </span>
        )}
      </div>
    </div>
  );
};

const CreateReference = ({ selection, onCancel }: CreateReferenceProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const setCreateReferenceSelection = useSetAtom(createReferenceSelectionAtom);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRelationshipTypeToggle = useCallback((relationshipTypeId: string) => {
    setSelectedRelationshipTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(relationshipTypeId)) {
        newSet.delete(relationshipTypeId);
      } else {
        newSet.add(relationshipTypeId);
      }
      return newSet;
    });
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const result = await searchAPI.search({
        filters: {
          searchString: query,
        },
        fields: ['title', 'template', 'creationDate', 'editDate'],
        limit: 20,
      });

      if (result instanceof Error) {
        setSearchResults([]);
      } else {
        setSearchResults(result.rows || []);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchQuery(value);
  }, []);

  // Debounce search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleEntitySelect = useCallback(
    (entity: Entity) => {
      // TODO: Implement creating the reference
      console.log('Create reference:', {
        selection,
        entity,
        relationshipTypes: Array.from(selectedRelationshipTypes),
      });
    },
    [selection, selectedRelationshipTypes]
  );

  return (
    <Panel className="gap-4">
      <Panel.Body className="pr-1">
        <div className="flex flex-col gap-4 h-full">
          {/* Relationship Types Section */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-gray-900">
              <Translate>Relationship type</Translate>
            </h2>
            <div className="flex flex-col gap-2">
              {relationshipTypes.length > 0 ? (
                relationshipTypes.map(relationshipType => (
                  <label
                    key={relationshipType._id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRelationshipTypes.has(relationshipType._id)}
                      onChange={() => handleRelationshipTypeToggle(relationshipType._id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">{relationshipType.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  <Translate>No relationship types available</Translate>
                </p>
              )}
            </div>
          </div>

          {/* Search Section */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="search"
                placeholder={t('System', 'Search', null, false)}
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full border border-gray-200 rounded-lg bg-white shadow-sm placeholder-gray-400 p-2 pr-10"
              />
              <MagnifyingGlassIcon
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>

            {/* Search Results */}
            {hasSearched && (
              <div className="flex-1 min-h-0 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Translate>Searching...</Translate>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {searchResults.map(entity => (
                      <EntitySearchResult
                        key={entity._id}
                        entity={entity}
                        onClick={() => handleEntitySelect(entity)}
                      />
                    ))}
                  </div>
                ) : (
                  <BlankState
                    icon={
                      <MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
                    }
                    title={<Translate>No results found</Translate>}
                    description={
                      <Translate>Try adjusting your search terms or check for typos</Translate>
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Panel.Body>

      <Panel.Footer>
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => {
              setCreateReferenceSelection(undefined);
              onCancel?.();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Translate>Cancel</Translate>
          </button>
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { CreateReference };
