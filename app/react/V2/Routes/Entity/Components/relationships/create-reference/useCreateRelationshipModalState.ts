import { useState, useCallback, useEffect, useMemo } from 'react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { t } from '#app/I18N/index.js';
import type { ClientRelationshipType, Template } from '#app/apiResponseTypes.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { FileType } from '#shared/types/fileType.js';
import { getEntityPdfFiles } from './getEntityPdfFiles.js';
import type { CreateRelationshipStep } from './createRelationshipModalTypes.js';

type UseCreateRelationshipModalStateParams = {
  selection: TextSelection | undefined;
  relationshipTypes: ClientRelationshipType[];
  templates: Template[];
  searchFunction: (search: string) => ReturnType<typeof searchByTitle>;
};

function useCreateRelationshipModalState({
  selection,
  relationshipTypes,
  templates,
  searchFunction,
}: UseCreateRelationshipModalStateParams) {
  const [step, setStep] = useState<CreateRelationshipStep>('entity');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<FileType | undefined>(undefined);
  const [targetSelection, setTargetSelection] = useState<TextSelection | undefined>(undefined);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | undefined>(
    relationshipTypes[0]?._id
  );
  const [newEntityTitle, setNewEntityTitle] = useState('');
  const [newEntityTemplateId, setNewEntityTemplateId] = useState(templates[0]?._id ?? '');

  const isTextAnchored = Boolean(selection?.selectionRectangles?.length);
  const targetPdfFiles = useMemo(
    () => (selectedEntity ? getEntityPdfFiles(selectedEntity) : []),
    [selectedEntity]
  );

  const defaultTemplateId = useMemo(
    () => templates.find(template => template.default)?._id ?? templates[0]?._id ?? '',
    [templates]
  );

  const groupedResults = useMemo(() => {
    const groups = new Map<string, Entity[]>();
    searchResults.forEach(entity => {
      const key = entity.template || 'unknown';
      const group = groups.get(key) ?? [];
      group.push(entity);
      groups.set(key, group);
    });
    return groups;
  }, [searchResults]);

  const clearSearchState = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
  }, []);

  const clearTargetState = useCallback(() => {
    setSelectedEntity(undefined);
    setSelectedFile(undefined);
    setTargetSelection(undefined);
  }, []);

  const setSearchIdle = useCallback(() => {
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
  }, []);

  const setSearchActive = useCallback(() => {
    setIsSearching(true);
    setHasSearched(true);
  }, []);

  const filterSearchResults = useCallback(
    (result: Entity[] | undefined) =>
      isTextAnchored && result
        ? result.filter(entity => getEntityPdfFiles(entity).length > 0)
        : (result ?? []),
    [isTextAnchored]
  );

  const reset = useCallback(() => {
    setStep('entity');
    clearSearchState();
    clearTargetState();
    setSelectedRelationshipType(relationshipTypes[0]?._id);
    setNewEntityTitle('');
    setNewEntityTemplateId(defaultTemplateId);
  }, [clearSearchState, clearTargetState, defaultTemplateId, relationshipTypes]);

  const handleSearch = useCallback(
    async (searchString: string) => {
      if (!searchString.trim()) {
        setSearchIdle();
        return;
      }
      setSearchActive();
      try {
        const [result] = await searchFunction(searchString);
        setSearchResults(filterSearchResults(result));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [filterSearchResults, searchFunction, setSearchActive, setSearchIdle]
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchIdle();
      return undefined;
    }
    setSearchActive();
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery).catch(() => undefined);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch, setSearchActive, setSearchIdle]);

  const handleStartNewEntity = useCallback(() => {
    setNewEntityTitle(selection?.text?.trim() ?? '');
    setNewEntityTemplateId(defaultTemplateId);
    setStep('new-entity');
  }, [defaultTemplateId, selection?.text]);

  const goToRelationStep = useCallback((entity: Entity, file?: FileType) => {
    setSelectedEntity(entity);
    setSelectedFile(file);
    setTargetSelection(undefined);
    setStep('relation');
  }, []);

  const handleEntitySelect = useCallback(
    (entity: Entity) => {
      setSelectedEntity(entity);
      setSelectedFile(undefined);
      setTargetSelection(undefined);
      if (isTextAnchored && getEntityPdfFiles(entity).length > 0) {
        setStep('target-file');
        return;
      }
      setStep('relation');
    },
    [isTextAnchored]
  );

  const handleTargetFileSelect = useCallback(
    (file: FileType) => {
      if (!selectedEntity) return;
      goToRelationStep(selectedEntity, file);
    },
    [goToRelationStep, selectedEntity]
  );

  const handleSkipTargetFile = useCallback(() => {
    if (!selectedEntity) return;
    goToRelationStep(selectedEntity);
  }, [goToRelationStep, selectedEntity]);

  const handleRelationshipTypeSelect = useCallback((relationshipTypeId: string) => {
    setSelectedRelationshipType(relationshipTypeId);
  }, []);

  const handleContinueToTargetText = useCallback(() => {
    setTargetSelection(undefined);
    setStep('target-text');
  }, []);

  const handleTargetPdfSelect = useCallback((targetSel: TextSelection) => {
    setTargetSelection(targetSel.selectionRectangles?.length ? targetSel : undefined);
  }, []);

  const handleTargetPdfDeselect = useCallback(() => setTargetSelection(undefined), []);

  const templateName = useCallback(
    (templateId: string) => {
      const template = templates.find(item => item._id === templateId);
      return template ? t(template._id, template.name, null, false) : templateId;
    },
    [templates]
  );

  if (typeof window !== 'undefined' && (window as Window & { Cypress?: unknown }).Cypress) {
    (
      window as Window & { __createRelationshipModalTestApi?: object }
    ).__createRelationshipModalTestApi = { handleTargetPdfSelect };
  }

  return {
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    hasSearched,
    groupedResults,
    selectedEntity,
    selectedFile,
    targetSelection,
    targetPdfFiles,
    isTextAnchored,
    selectedRelationshipType,
    newEntityTitle,
    setNewEntityTitle,
    newEntityTemplateId,
    setNewEntityTemplateId,
    reset,
    handleStartNewEntity,
    handleEntitySelect,
    handleTargetFileSelect,
    handleSkipTargetFile,
    handleRelationshipTypeSelect,
    handleContinueToTargetText,
    handleTargetPdfSelect,
    handleTargetPdfDeselect,
    templateName,
  };
}

export type { CreateRelationshipStep };
export { useCreateRelationshipModalState };
