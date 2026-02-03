import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from 'app/I18N';
import { Panel } from 'V2/Components/Layouts/Panel';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import { Entity } from 'V2/domain';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { FileType } from 'shared/types/fileType';
import { Button } from 'V2/Components/UI/Button';
import { Card } from 'V2/Components/UI';
import { Checkbox } from 'V2/Components/Forms/Checkbox';
import { InputField } from 'V2/Components/Forms';
import { BlankState } from '../BlankState';
import { EntitySearchResult } from './EntitySearchResult';

type SearchFunction = (searchString: string) => Promise<Entity[]>;

type ReferenceMode = 'entity' | 'text';

type CreateReferenceProps = {
  selection: TextSelection;
  relationshipTypes: ClientRelationshipType[];
  searchFunction: SearchFunction;
  mode?: ReferenceMode;
  onSave?: (data: {
    selection: TextSelection;
    targetEntityId: string;
    relationshipType: string;
    targetFileId?: string;
  }) => void;
  onCancel?: () => void;
};

const CreateReference = ({
  selection,
  relationshipTypes,
  searchFunction,
  mode = 'text',
  onSave,
  onCancel,
}: CreateReferenceProps) => {
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | undefined>(
    undefined
  );
  const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<FileType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRelationshipTypeToggle = useCallback((relationshipTypeId: string) => {
    setSelectedRelationshipType(prev =>
      prev === relationshipTypeId ? undefined : relationshipTypeId
    );
  }, []);

  const handleSearch = useCallback(
    async (searchString: string) => {
      if (!searchString.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      try {
        const result = await searchFunction(searchString);
        const filteredResults =
          mode === 'text'
            ? result.filter(
                entity =>
                  (entity.mainDocument && entity.mainDocument.length > 0) ||
                  (entity.documents && entity.documents.length > 0) ||
                  (entity.attachments && entity.attachments.length > 0)
              )
            : result;
        setSearchResults(filteredResults);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchFunction, mode]
  );

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchQuery(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setSelectedEntity(undefined);
  }, []);

  // Debounce search effect
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    setHasSearched(true);

    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery).catch(() => {
        // Ignore search errors
      });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, handleSearch]);

  const handleEntitySelect = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
    setSelectedFile(undefined); // Reset file selection when entity changes
  }, []);

  const handleFileSelect = useCallback((file: FileType) => {
    setSelectedFile(prevFile => {
      // If clicking the same file, deselect it
      if (prevFile && String(prevFile._id) === String(file._id)) {
        return undefined;
      }
      // Otherwise, select the new file (this will deselect the previous one automatically)
      return file;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (selectedRelationshipType && selectedEntity && selectedEntity.sharedId && onSave) {
      const saveData: {
        selection: TextSelection;
        targetEntityId: string;
        relationshipType: string;
        targetFileId?: string;
      } = {
        selection,
        targetEntityId: selectedEntity.sharedId,
        relationshipType: selectedRelationshipType,
      };

      // In text mode, include targetFileId if a file is selected
      if (mode === 'text' && selectedFile) {
        saveData.targetFileId = String(selectedFile._id);
      }

      onSave(saveData);
    }
  }, [selection, selectedRelationshipType, selectedEntity, selectedFile, mode, onSave]);

  return (
    <Panel className="gap-4">
      <Panel.Body className="pt-2">
        <div className="flex flex-col gap-2 h-full">
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
                      onChange={() => handleRelationshipTypeToggle(relationshipType._id)}
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
              onChange={handleSearchInputChange}
              hideLabel
              icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
              clearFieldAction={handleClearSearch}
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
                    {searchResults.map(entity => {
                      const isSelected = selectedEntity?._id === entity._id;

                      return (
                        <EntitySearchResult
                          entity={entity}
                          onClick={() => handleEntitySelect(entity)}
                          isSelected={isSelected}
                          mode={mode}
                          selectedFile={selectedFile}
                          onFileSelect={handleFileSelect}
                        />
                      );
                    })}
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
      </Panel.Body>

      <Panel.Footer>
        <div className="flex justify-end w-full gap-2">
          <Button styling="outline" color="primary" onClick={onCancel}>
            <Translate>Cancel</Translate>
          </Button>
          <Button
            styling="solid"
            color="success"
            onClick={handleSave}
            disabled={
              !selectedRelationshipType || !selectedEntity || (mode === 'text' && !selectedFile)
            }
          >
            <Translate>Save</Translate>
          </Button>
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { CreateReference };
