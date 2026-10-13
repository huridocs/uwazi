import { useMemo } from 'react';
import { resolveFormMountHost } from '../metadataEditingSession.js';
import {
  EDIT_ENTITY_FORM_ID,
  type MetadataEditingActions,
  type MetadataEditingState,
} from '../metadataEditingTypes.js';
import { useMetadataEditingFlags } from './useMetadataEditingFlags.js';
import { useMetadataEditingForm } from './useMetadataEditingForm.js';
import { useMetadataEditingLifecycle } from './useMetadataEditingLifecycle.js';
import { useMetadataHostPresence } from './useMetadataHostPresence.js';
import { useMetadataSaveGate } from './useMetadataSaveGate.js';
import { useTranslationStop } from './useTranslationStop.js';

const useMetadataEditingController = (): {
  state: MetadataEditingState;
  actions: MetadataEditingActions;
} => {
  const flags = useMetadataEditingFlags();
  const stop = useTranslationStop(flags.translationsPendingRef);
  const save = useMetadataSaveGate();
  const hosts = useMetadataHostPresence();
  const formSession = useMetadataEditingForm();
  const lifecycle = useMetadataEditingLifecycle({
    flags,
    save,
    hosts,
    formSession,
    cancelTranslations: stop.cancelTranslations,
  });
  const { setSaveError, setEditErrors, registerCancelEdit } = formSession;

  const state = useMemo(
    (): MetadataEditingState => ({
      isEditing: flags.isEditing,
      isSaving: save.isSaving,
      isDirty: flags.isDirty,
      translationsPending: flags.translationsPending,
      translationStopOpen: stop.translationStopOpen,
      pendingDiscardAction: lifecycle.discard.pendingDiscardAction,
      lastMetadataAnchor: hosts.lastMetadataAnchor,
      formMountHost: flags.isEditing
        ? resolveFormMountHost(
            hosts.metadataActiveByHost.main,
            hosts.metadataActiveByHost.side,
            hosts.lastMetadataAnchor
          )
        : null,
      form: formSession.form,
      formId: EDIT_ENTITY_FORM_ID,
      mediaUpload: formSession.mediaUpload,
      saveError: formSession.saveError,
      editErrors: formSession.editErrors,
    }),
    [
      flags.isDirty,
      flags.isEditing,
      flags.translationsPending,
      formSession.editErrors,
      stop.translationStopOpen,
      formSession.form,
      formSession.mediaUpload,
      formSession.saveError,
      hosts.lastMetadataAnchor,
      hosts.metadataActiveByHost,
      lifecycle.discard.pendingDiscardAction,
      save.isSaving,
    ]
  );

  const actions = useMemo(
    (): MetadataEditingActions => ({
      setIsSaving: save.setIsSaving,
      setIsDirty: flags.setIsDirty,
      setTranslationsPending: flags.setTranslationsPending,
      setSaveError,
      setEditErrors,
      startEditing: lifecycle.startEditing,
      registerMetadataActive: hosts.registerMetadataActive,
      finishEditing: lifecycle.finishEditing,
      registerCancelEdit,
      tryBeginSave: save.tryBeginSave,
      endSave: save.endSave,
      cancelEdit: lifecycle.cancelEdit,
      requestDiscard: lifecycle.discard.requestDiscard,
      confirmDiscard: lifecycle.discard.confirmDiscard,
      dismissDiscard: lifecycle.discard.dismissDiscard,
      registerCancelTranslations: stop.registerCancelTranslations,
      requestStopTranslations: stop.requestStopTranslations,
      confirmStopTranslations: stop.confirmStopTranslations,
      dismissStopTranslations: stop.dismissStopTranslations,
      cancelTranslations: stop.cancelTranslations,
    }),
    [
      flags.setIsDirty,
      flags.setTranslationsPending,
      stop.cancelTranslations,
      stop.confirmStopTranslations,
      stop.dismissStopTranslations,
      stop.registerCancelTranslations,
      stop.requestStopTranslations,
      hosts.registerMetadataActive,
      lifecycle.cancelEdit,
      lifecycle.discard.confirmDiscard,
      lifecycle.discard.dismissDiscard,
      lifecycle.discard.requestDiscard,
      lifecycle.finishEditing,
      lifecycle.startEditing,
      registerCancelEdit,
      save.endSave,
      save.setIsSaving,
      save.tryBeginSave,
      setEditErrors,
      setSaveError,
    ]
  );

  return { state, actions };
};

export { useMetadataEditingController };
