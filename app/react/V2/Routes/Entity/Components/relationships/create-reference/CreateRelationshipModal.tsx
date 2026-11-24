import React, { useCallback, useEffect, useState } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { t } from '#app/I18N/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { create as createEntity } from '#V2/api/entities/index.js';
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
import { useServices } from '#V2/services/index.js';

type CreateRelationshipModalProps = {
  mainDocument?: FileType;
};

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
  setSaveError,
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
  setSaveError: (value: boolean) => void;
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

  const handleCreate = useCallback(async () => {
    if (!selectedEntity?.sharedId || !selectedRelationshipType || !entity) return;
    const targetEntity = selectedEntity;

    const applyCreateResult = (saved: boolean) => {
      if (!saved) {
        setSaveError(true);
        return;
      }
      notify(t('System', 'Relationship created', null, false), 'success', targetEntity.title);
      reset();
    };

    setSaveError(false);
    setIsSaving(true);
    try {
      await applyCreateResult(
        await handleSaveReference({
          selection: createReferenceSelection,
          targetEntityId: targetEntity.sharedId,
          relationshipType: selectedRelationshipType,
          sourcePage: store.get(entityPageAtom),
          ...(selectedFile && { targetFileId: String(selectedFile._id) }),
          ...(targetSelection && { targetSelection }),
        })
      );
    } catch {
      setSaveError(true);
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
    setSaveError,
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
  const [saveError, setSaveError] = useState(false);
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
    saveError,
    setSaveError,
  };
};

const useCreateRelationshipModal = (mainDocument?: FileType) => {
  const { search } = useServices();
  const deps = useCreateRelationshipDeps(mainDocument);
  const state = useCreateRelationshipModalState({
    selection: deps.relationships.createReferenceSelection,
    relationshipTypes: deps.relationshipTypes,
    templates: deps.templates,
    searchFunction: search.search,
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
    setSaveError: deps.setSaveError,
    isTextAnchored: state.isTextAnchored,
    targetPdfFiles: state.targetPdfFiles,
    setStep: state.setStep,
  });
  const { reset, step } = state;
  const { setSaveError } = deps;
  const isOpen = deps.relationships.createRelationshipModalOpen;
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSaveError(false);
    }
  }, [isOpen, reset, setSaveError]);
  useEffect(() => {
    setSaveError(false);
  }, [step, setSaveError]);
  return { isOpen, deps, state, handlers };
};

const CreateRelationshipModal = ({ mainDocument }: CreateRelationshipModalProps) => {
  const { isOpen, deps, state, handlers } = useCreateRelationshipModal(mainDocument);
  if (!isOpen) return null;
  return (
    <CreateRelationshipModalBody
      state={state}
      isSaving={deps.isSaving}
      saveError={deps.saveError}
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
