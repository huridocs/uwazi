import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
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
import { PDF } from 'V2/Components/PDFViewer';
import { BlankState } from '../BlankState';
import { EntitySearchResult } from './EntitySearchResult';

type SearchFunction = (searchString: string) => Promise<Entity[]>;

type ReferenceMode = 'entity' | 'text';

type CreateReferenceStep = 'selectTarget' | 'selectTextInTarget';

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
    targetSelection?: TextSelection;
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
  const [step, setStep] = useState<CreateReferenceStep>('selectTarget');
  const [targetSelection, setTargetSelection] = useState<TextSelection | undefined>(undefined);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | undefined>(
    undefined
  );
  const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<FileType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const isTextModeWithFile = mode === 'text' && selectedFile;
  const canContinue = Boolean(
    selectedRelationshipType && selectedEntity?.sharedId && isTextModeWithFile
  );
  const showContinueButton = mode === 'text' && canContinue && step === 'selectTarget';
  const showSaveButton = step === 'selectTextInTarget' || !showContinueButton;

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
      if (prevFile && String(prevFile._id) === String(file._id)) {
        return undefined;
      }
      return file;
    });
    setStep('selectTarget');
    setTargetSelection(undefined);
  }, []);

  const handleContinue = useCallback(() => {
    if (canContinue) {
      setStep('selectTextInTarget');
      setTargetSelection(undefined);
    }
  }, [canContinue]);

  const handleTargetPdfSelect = useCallback((targetSel: TextSelection) => {
    if (targetSel.selectionRectangles && targetSel.selectionRectangles.length > 0) {
      setTargetSelection(targetSel);
    } else {
      setTargetSelection(undefined);
    }
  }, []);

  const handleTargetPdfDeselect = useCallback(() => {
    setTargetSelection(undefined);
  }, []);

  const handleSave = useCallback(() => {
    if (selectedRelationshipType && selectedEntity && selectedEntity.sharedId && onSave) {
      const saveData: {
        selection: TextSelection;
        targetEntityId: string;
        relationshipType: string;
        targetFileId?: string;
        targetSelection?: TextSelection;
      } = {
        selection,
        targetEntityId: selectedEntity.sharedId,
        relationshipType: selectedRelationshipType,
      };

      if (mode === 'text' && selectedFile) {
        saveData.targetFileId = String(selectedFile._id);
      }
      if (step === 'selectTextInTarget' && targetSelection) {
        saveData.targetSelection = targetSelection;
      }

      onSave(saveData);
    }
  }, [
    selection,
    selectedRelationshipType,
    selectedEntity,
    selectedFile,
    mode,
    onSave,
    step,
    targetSelection,
  ]);

  return (
    <Panel className="gap-4">
      <Panel.Body className="pt-2 flex flex-col min-h-0">
        {step === 'selectTarget' ? (
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
                            key={entity._id}
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
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            {selectedFile?.filename && (
              <div className="flex-1 min-h-[200px] overflow-auto border border-gray-200 rounded-md">
                <PDF
                  fileUrl={`/api/files/${selectedFile.filename}`}
                  size={{ height: '100%', width: '100%', overflow: 'auto' }}
                  onSelect={handleTargetPdfSelect}
                  onDeselect={handleTargetPdfDeselect}
                />
              </div>
            )}
            {targetSelection?.text && (
              <p className="text-sm text-gray-500 shrink-0 truncate" title={targetSelection.text}>
                &quot;{targetSelection.text}&quot;
              </p>
            )}
          </div>
        )}
      </Panel.Body>

      <Panel.Footer>
        <div className="flex justify-end w-full gap-2">
          <Button styling="outline" color="primary" onClick={onCancel}>
            <Translate>Cancel</Translate>
          </Button>
          {showContinueButton && (
            <Button
              styling="solid"
              color="primary"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              <Translate>Continue</Translate>
            </Button>
          )}
          {showSaveButton && (
            <Button
              styling="solid"
              color="success"
              onClick={handleSave}
              disabled={
                !selectedRelationshipType ||
                !selectedEntity ||
                (mode === 'text' && !selectedFile) ||
                (step === 'selectTextInTarget' && !targetSelection)
              }
            >
              <Translate>Save</Translate>
            </Button>
          )}
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { CreateReference };
