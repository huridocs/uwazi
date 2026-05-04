import { useState, useCallback, useEffect } from 'react';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { searchByTitle } from '#V2/api/entities/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { FileType } from '#shared/types/fileType.js';

type CreateReferenceStep = 'selectTarget' | 'selectTextInTarget';

type ReferenceMode = 'entity' | 'text';

type UseCreateReferenceStateParams = {
  selection: TextSelection;
  searchFunction: (search: string) => ReturnType<typeof searchByTitle>;
  mode: ReferenceMode;
  onSave?: (data: {
    selection: TextSelection;
    targetEntityId: string;
    relationshipType: string;
    targetFileId?: string;
    targetSelection?: TextSelection;
  }) => void;
};

function useCreateReferenceState({
  selection,
  searchFunction,
  mode,
  onSave,
}: UseCreateReferenceStateParams) {
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
    // eslint-disable-next-line max-statements
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
        const [result] = await searchFunction(searchString);
        const filteredResults =
          mode === 'text'
            ? result?.filter(
                entity =>
                  (entity.documents && entity.documents.length > 0) ||
                  (entity.attachments && entity.attachments.length > 0)
              )
            : result;

        setSearchResults(filteredResults || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchFunction, mode]
  );

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setSelectedEntity(undefined);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return undefined;
    }
    setIsSearching(true);
    setHasSearched(true);
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery).catch(() => {});
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleEntitySelect = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
    setSelectedFile(undefined);
  }, []);

  const handleFileSelect = useCallback((file: FileType) => {
    setSelectedFile(prevFile => {
      if (prevFile && String(prevFile._id) === String(file._id)) return undefined;
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

  const handleBack = useCallback(() => {
    setStep('selectTarget');
  }, []);

  const handleTargetPdfSelect = useCallback((targetSel: TextSelection) => {
    setTargetSelection(targetSel.selectionRectangles?.length ? targetSel : undefined);
  }, []);

  const handleTargetPdfDeselect = useCallback(() => setTargetSelection(undefined), []);

  const handleSave = useCallback(() => {
    if (!selectedRelationshipType || !selectedEntity?.sharedId || !onSave) return;
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
    if (mode === 'text' && selectedFile) saveData.targetFileId = String(selectedFile._id);
    if (step === 'selectTextInTarget' && targetSelection) {
      saveData.targetSelection = targetSelection;
    }
    onSave(saveData);
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

  if (typeof window !== 'undefined' && (window as any).Cypress) {
    (window as any).__createReferenceTestApi = {
      handleTargetPdfSelect,
    };
  }

  return {
    step,
    targetSelection,
    selectedRelationshipType,
    selectedEntity,
    selectedFile,
    searchQuery,
    searchResults,
    isSearching,
    hasSearched,
    canContinue,
    showContinueButton,
    showSaveButton,
    handleRelationshipTypeToggle,
    handleSearchInputChange,
    handleClearSearch,
    handleEntitySelect,
    handleFileSelect,
    handleContinue,
    handleBack,
    handleTargetPdfSelect,
    handleTargetPdfDeselect,
    handleSave,
  };
}

export type { CreateReferenceStep, ReferenceMode };
export { useCreateReferenceState };
