import React, { useCallback, useEffect, useState } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { t } from '#app/I18N/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { create as createEntity, searchByTitle } from '#V2/api/entities/index.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import {
  useEntityScopedEntity,
  useRelationships,
  useRelationshipsActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useCreateRelationshipModalState } from './useCreateRelationshipModalState.js';
import { CreateRelationshipModalBody } from './CreateRelationshipModalBody.js';
import { useRelationshipSave } from '../hooks/useRelationshipSave.js';
import { entityPageAtom } from '#V2/Routes/Entity/entityUrlAtoms.js';

type CreateRelationshipModalProps = {
  mainDocument?: FileType;
};

const lookupEntitiesByTitle = async (searchString: string) =>
  searchByTitle({
    title: searchString,
    fields: ['title', 'template', 'creationDate', 'sharedId'],
    includeFiles: true,
  });

const useCreateRelationshipActions = ({
  closeCreateRelationship,
  reset,
  newEntityTitle,
  newEntityTemplateId,
  handleEntitySelect,
  selectedEntity,
  selectedRelationshipType,
  entity,
  handleSaveReference,
  createReferenceSelection,
  selectedFile,
  targetSelection,
  store,
  setIsSaving,
  isTextAnchored,
  targetPdfFiles,
  setStep,
}: {
  closeCreateRelationship: () => void;
  reset: () => void;
  newEntityTitle: string;
  newEntityTemplateId: string;
  handleEntitySelect: ReturnType<typeof useCreateRelationshipModalState>['handleEntitySelect'];
  selectedEntity: ReturnType<typeof useCreateRelationshipModalState>['selectedEntity'];
  selectedRelationshipType: ReturnType<
    typeof useCreateRelationshipModalState
  >['selectedRelationshipType'];
  entity: ReturnType<typeof useEntityScopedEntity>;
  handleSaveReference: ReturnType<typeof useRelationshipSave>['handleSaveReference'];
  createReferenceSelection: ReturnType<typeof useRelationships>['createReferenceSelection'];
  selectedFile: ReturnType<typeof useCreateRelationshipModalState>['selectedFile'];
  targetSelection: ReturnType<typeof useCreateRelationshipModalState>['targetSelection'];
  store: ReturnType<typeof useStore>;
  setIsSaving: (value: boolean) => void;
  isTextAnchored: boolean;
  targetPdfFiles: ReturnType<typeof useCreateRelationshipModalState>['targetPdfFiles'];
  setStep: ReturnType<typeof useCreateRelationshipModalState>['setStep'];
}) => {
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
  }, [handleEntitySelect, newEntityTemplateId, newEntityTitle, setIsSaving]);

  const notifyCreateError = () => {
    notify(
      t('System', 'Error', null, false),
      'error',
      t('System', 'An error occurred', null, false)
    );
  };

  const handleCreate = useCallback(async () => {
    if (!selectedEntity?.sharedId || !selectedRelationshipType || !entity) return;
    setIsSaving(true);
    try {
      const saved = await handleSaveReference({
        selection: createReferenceSelection,
        targetEntityId: selectedEntity.sharedId,
        relationshipType: selectedRelationshipType,
        sourcePage: store.get(entityPageAtom),
        ...(selectedFile && { targetFileId: String(selectedFile._id) }),
        ...(targetSelection && { targetSelection }),
      });
      if (!saved) {
        notifyCreateError();
        return;
      }
      notify(t('System', 'Relationship created', null, false), 'success', selectedEntity.title);
      reset();
    } finally {
      setIsSaving(false);
    }
  }, [
    createReferenceSelection,
    entity,
    handleSaveReference,
    reset,
    selectedEntity,
    selectedFile,
    selectedRelationshipType,
    setIsSaving,
    store,
    targetSelection,
  ]);

  const handleRelationBack = useCallback(() => {
    if (isTextAnchored && targetPdfFiles.length > 0) {
      setStep('target-file');
      return;
    }
    setStep('entity');
  }, [isTextAnchored, setStep, targetPdfFiles.length]);

  return { handleClose, handleConfirmNewEntity, handleCreate, handleRelationBack };
};

const useCreateRelationshipDeps = (mainDocument?: FileType) => {
  const entity = useEntityScopedEntity();
  const relationships = useRelationships();
  const { closeCreateRelationship } = useRelationshipsActions();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { handleSaveReference } = useRelationshipSave(mainDocument);
  const store = useStore();
  const [isSaving, setIsSaving] = useState(false);
  return {
    entity,
    relationships,
    closeCreateRelationship,
    relationshipTypes,
    templates,
    handleSaveReference,
    store,
    isSaving,
    setIsSaving,
  };
};

const useCreateRelationshipModal = (mainDocument?: FileType) => {
  const deps = useCreateRelationshipDeps(mainDocument);
  const state = useCreateRelationshipModalState({
    selection: deps.relationships.createReferenceSelection,
    relationshipTypes: deps.relationshipTypes,
    templates: deps.templates,
    searchFunction: lookupEntitiesByTitle,
  });
  const handlers = useCreateRelationshipActions({
    closeCreateRelationship: deps.closeCreateRelationship,
    reset: state.reset,
    newEntityTitle: state.newEntityTitle,
    newEntityTemplateId: state.newEntityTemplateId,
    handleEntitySelect: state.handleEntitySelect,
    selectedEntity: state.selectedEntity,
    selectedRelationshipType: state.selectedRelationshipType,
    entity: deps.entity,
    handleSaveReference: deps.handleSaveReference,
    createReferenceSelection: deps.relationships.createReferenceSelection,
    selectedFile: state.selectedFile,
    targetSelection: state.targetSelection,
    store: deps.store,
    setIsSaving: deps.setIsSaving,
    isTextAnchored: state.isTextAnchored,
    targetPdfFiles: state.targetPdfFiles,
    setStep: state.setStep,
  });
  const { reset } = state;
  const isOpen = deps.relationships.createRelationshipModalOpen;
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);
  return { isOpen, deps, state, handlers };
};

const CreateRelationshipModal = ({ mainDocument }: CreateRelationshipModalProps) => {
  const { isOpen, deps, state, handlers } = useCreateRelationshipModal(mainDocument);
  if (!isOpen) return null;
  return (
    <CreateRelationshipModalBody
      state={state}
      isSaving={deps.isSaving}
      templates={deps.templates}
      relationshipTypes={deps.relationshipTypes}
      selectionPreview={deps.relationships.createReferenceSelection?.text?.trim()}
      onClose={handlers.handleClose}
      onConfirmNewEntity={handlers.handleConfirmNewEntity}
      onCreate={handlers.handleCreate}
      onRelationBack={handlers.handleRelationBack}
    />
  );
};

export { CreateRelationshipModal };
