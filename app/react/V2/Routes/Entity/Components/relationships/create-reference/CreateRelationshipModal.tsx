import React, { useCallback, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useSearchParams } from 'react-router';
import { t } from '#app/I18N/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { create as createEntity, searchByTitle } from '#V2/api/entities/index.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { Modal } from '#V2/Components/UI/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import {
  useEntityScopedEntity,
  useRelationships,
  useRelationshipsActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useCreateRelationshipModalState } from './useCreateRelationshipModalState.js';
import { EntitySearchStep } from './EntitySearchStep.js';
import { NewEntityStep } from './NewEntityStep.js';
import { TargetFileStep } from './TargetFileStep.js';
import { RelationTypeStep } from './RelationTypeStep.js';
import { TargetTextStep } from './TargetTextStep.js';
import { CreateRelationshipModalHeader } from './CreateRelationshipModalHeader.js';
import { useRelationshipSave } from '../hooks/useRelationshipSave.js';
import { PAGE_PARAM } from '#V2/Routes/Entity/urlParams.js';

type CreateRelationshipModalProps = {
  mainDocument?: FileType;
};

const CreateRelationshipModal = ({ mainDocument }: CreateRelationshipModalProps) => {
  const entity = useEntityScopedEntity();
  const { createReferenceSelection, createRelationshipModalOpen } = useRelationships();
  const { closeCreateRelationship } = useRelationshipsActions();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { handleSaveReference } = useRelationshipSave(mainDocument);
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const lookup = useCallback(
    async (searchString: string) =>
      searchByTitle({
        title: searchString,
        fields: ['title', 'template', 'creationDate', 'sharedId'],
        includeFiles: true,
      }),
    []
  );

  const {
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
  } = useCreateRelationshipModalState({
    selection: createReferenceSelection,
    relationshipTypes,
    templates,
    searchFunction: lookup,
  });

  useEffect(() => {
    if (!createRelationshipModalOpen) reset();
  }, [createRelationshipModalOpen, reset]);

  const handleClose = useCallback(() => {
    closeCreateRelationship();
    reset();
  }, [closeCreateRelationship, reset]);

  const handleConfirmNewEntity = useCallback(async () => {
    if (!newEntityTitle.trim() || !newEntityTemplateId) return;
    setIsSaving(true);
    const [created] = await createEntity({
      title: newEntityTitle.trim(),
      template: newEntityTemplateId,
    });
    setIsSaving(false);
    if (!created?.sharedId) {
      notify(
        t('System', 'Error', null, false),
        'error',
        t('System', 'Could not create entity', null, false)
      );
      return;
    }
    handleEntitySelect(created);
  }, [handleEntitySelect, newEntityTemplateId, newEntityTitle]);

  const handleCreate = useCallback(async () => {
    if (!selectedEntity?.sharedId || !selectedRelationshipType || !entity) return;
    setIsSaving(true);
    await handleSaveReference({
      selection: createReferenceSelection,
      targetEntityId: selectedEntity.sharedId,
      relationshipType: selectedRelationshipType,
      sourcePage: searchParams.get(PAGE_PARAM) ?? '1',
      ...(selectedFile && { targetFileId: String(selectedFile._id) }),
      ...(targetSelection && { targetSelection }),
    });
    setIsSaving(false);
    notify(t('System', 'Relationship created', null, false), 'success', selectedEntity.title);
    handleClose();
  }, [
    createReferenceSelection,
    entity,
    handleClose,
    handleSaveReference,
    searchParams,
    selectedEntity,
    selectedFile,
    selectedRelationshipType,
    targetSelection,
  ]);

  const handleRelationBack = useCallback(() => {
    if (isTextAnchored && targetPdfFiles.length > 0) {
      setStep('target-file');
      return;
    }
    setStep('entity');
  }, [isTextAnchored, setStep, targetPdfFiles.length]);

  if (!createRelationshipModalOpen) return null;

  return (
    <Modal
      size={step === 'target-text' ? 'xxl' : 'lg'}
      ariaLabel={t('System', 'Create relationship', null, false)}
    >
      <CreateRelationshipModalHeader
        step={step}
        selectionPreview={createReferenceSelection?.text?.trim()}
        isSaving={isSaving}
        onClose={handleClose}
      />

      {step === 'entity' && (
        <EntitySearchStep
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          hasSearched={hasSearched}
          groupedResults={groupedResults}
          searchResults={searchResults}
          templateName={templateName}
          onStartNewEntity={handleStartNewEntity}
          onEntitySelect={handleEntitySelect}
        />
      )}

      {step === 'new-entity' && (
        <NewEntityStep
          newEntityTitle={newEntityTitle}
          setNewEntityTitle={setNewEntityTitle}
          newEntityTemplateId={newEntityTemplateId}
          setNewEntityTemplateId={setNewEntityTemplateId}
          templates={templates}
          isSaving={isSaving}
          onBack={() => setStep('entity')}
          onConfirm={handleConfirmNewEntity}
        />
      )}

      {step === 'target-file' && selectedEntity && (
        <TargetFileStep
          selectedEntity={selectedEntity}
          targetPdfFiles={targetPdfFiles}
          isSaving={isSaving}
          onBack={() => setStep('entity')}
          onFileSelect={handleTargetFileSelect}
          onSkip={handleSkipTargetFile}
        />
      )}

      {step === 'relation' && selectedEntity && (
        <RelationTypeStep
          selectedEntity={selectedEntity}
          selectedFile={selectedFile}
          relationshipTypes={relationshipTypes}
          selectedRelationshipType={selectedRelationshipType}
          isSaving={isSaving}
          onBack={handleRelationBack}
          onRelationshipTypeSelect={handleRelationshipTypeSelect}
          onContinueToTargetText={handleContinueToTargetText}
          onCreate={handleCreate}
        />
      )}

      {step === 'target-text' && selectedEntity && selectedFile && (
        <TargetTextStep
          selectedEntity={selectedEntity}
          selectedFile={selectedFile}
          selectedRelationshipType={selectedRelationshipType}
          targetSelection={targetSelection}
          isSaving={isSaving}
          onBack={() => setStep('relation')}
          onCreate={handleCreate}
          onTargetPdfSelect={handleTargetPdfSelect}
          onTargetPdfDeselect={handleTargetPdfDeselect}
        />
      )}
    </Modal>
  );
};

export { CreateRelationshipModal };
