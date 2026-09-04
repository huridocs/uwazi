import React from 'react';
import { t } from '#app/I18N/index.js';
import type { ClientRelationshipType, Template } from '#app/apiResponseTypes.js';
import { Modal } from '#V2/Components/UI/index.js';
import { EntitySearchStep } from './EntitySearchStep.js';
import { NewEntityStep } from './NewEntityStep.js';
import { TargetFileStep } from './TargetFileStep.js';
import { RelationTypeStep } from './RelationTypeStep.js';
import { TargetTextStep } from './TargetTextStep.js';
import { CreateRelationshipModalHeader } from './CreateRelationshipModalHeader.js';
import type { useCreateRelationshipModalState } from './useCreateRelationshipModalState.js';

type ModalState = ReturnType<typeof useCreateRelationshipModalState>;

type CreateRelationshipModalBodyProps = {
  state: ModalState;
  isSaving: boolean;
  templates: Template[];
  relationshipTypes: ClientRelationshipType[];
  selectionPreview?: string;
  onClose: () => void;
  onConfirmNewEntity: () => void;
  onCreate: () => void;
  onRelationBack: () => void;
};

const CreateRelationshipModalBody = (props: CreateRelationshipModalBodyProps) => {
  const { state, isSaving, templates, relationshipTypes, selectionPreview } = props;
  const { onClose, onConfirmNewEntity, onCreate, onRelationBack } = props;
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
    selectedRelationshipType,
    newEntityTitle,
    setNewEntityTitle,
    newEntityTemplateId,
    setNewEntityTemplateId,
    handleStartNewEntity,
    handleEntitySelect,
    handleTargetFileSelect,
    handleSkipTargetFile,
    handleRelationshipTypeSelect,
    handleContinueToTargetText,
    handleTargetPdfSelect,
    handleTargetPdfDeselect,
    templateName,
  } = state;
  return (
    <Modal
      size={step === 'target-text' ? 'xxxxl' : 'lg'}
      ariaLabel={t('System', 'Create relationship', null, false)}
    >
      <CreateRelationshipModalHeader
        step={step}
        selectionPreview={selectionPreview}
        isSaving={isSaving}
        onClose={onClose}
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
          onConfirm={onConfirmNewEntity}
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
          onBack={onRelationBack}
          onRelationshipTypeSelect={handleRelationshipTypeSelect}
          onContinueToTargetText={handleContinueToTargetText}
          onCreate={onCreate}
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
          onCreate={onCreate}
          onTargetPdfSelect={handleTargetPdfSelect}
          onTargetPdfDeselect={handleTargetPdfDeselect}
        />
      )}
    </Modal>
  );
};

export { CreateRelationshipModalBody };
