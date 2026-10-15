import { useCallback, useMemo, useRef } from 'react';
import { buildEditEntityDefaultValues } from '#V2/Components/Metadata/EntityEditor/index.js';
import type { MetadataEditingHost } from '../metadataEditingSession.js';
import { useMetadataDiscard } from './useMetadataDiscard.js';
import type { useMetadataEditingFlags } from './useMetadataEditingFlags.js';
import type { useMetadataEditingForm } from './useMetadataEditingForm.js';
import type { useMetadataHostPresence } from './useMetadataHostPresence.js';
import type { useMetadataSaveGate } from './useMetadataSaveGate.js';

type LifecycleDeps = {
  flags: ReturnType<typeof useMetadataEditingFlags>;
  save: ReturnType<typeof useMetadataSaveGate>;
  hosts: ReturnType<typeof useMetadataHostPresence>;
  formSession: ReturnType<typeof useMetadataEditingForm>;
  cancelTranslations: () => void;
};

const useMetadataEditingLifecycle = ({
  flags: { setIsDirty, setIsEditing, isEditingRef, isDirtyRef, setTranslationsPending },
  save: { abortSave, setIsSaving, saveInFlightRef },
  hosts: { setLastMetadataAnchor },
  formSession: { entity, templates, form, mediaUpload, setSaveError, setEditErrors, formCancelRef },
  cancelTranslations,
}: LifecycleDeps) => {
  const cancelEditRef = useRef<() => void>(() => undefined);
  const runCancelEdit = useCallback(() => {
    cancelEditRef.current();
  }, []);
  const discardRefs = useMemo(
    () => ({
      isEditing: isEditingRef,
      isDirty: isDirtyRef,
    }),
    [isDirtyRef, isEditingRef]
  );
  const { pendingDiscardAction, requestDiscard, confirmDiscard, dismissDiscard, clearPending } =
    useMetadataDiscard(discardRefs, runCancelEdit);
  const stopEditing = useCallback(() => {
    cancelTranslations();
    setTranslationsPending(false);
    setIsEditing(false);
  }, [cancelTranslations, setIsEditing, setTranslationsPending]);

  const finishEditing = useCallback(() => {
    saveInFlightRef.current = false;
    mediaUpload.clearPendingAttachments();
    form.reset(buildEditEntityDefaultValues(entity, templates));
    setSaveError(undefined);
    setEditErrors(undefined);
    setIsDirty(false);
    setIsSaving(false);
    stopEditing();
    clearPending();
    setLastMetadataAnchor(null);
  }, [
    clearPending,
    entity,
    form,
    mediaUpload,
    saveInFlightRef,
    setEditErrors,
    setIsDirty,
    setIsSaving,
    stopEditing,
    setLastMetadataAnchor,
    setSaveError,
    templates,
  ]);

  const cancelEdit = useCallback(() => {
    abortSave();
    formCancelRef.current?.();
    finishEditing();
  }, [abortSave, finishEditing, formCancelRef]);
  cancelEditRef.current = cancelEdit;

  const startEditing = useCallback(
    (host: MetadataEditingHost) => {
      if (saveInFlightRef.current) return;
      if (!isEditingRef.current) {
        form.reset(buildEditEntityDefaultValues(entity, templates));
      }
      setLastMetadataAnchor(host);
      setIsEditing(true);
    },
    [entity, form, isEditingRef, saveInFlightRef, setIsEditing, setLastMetadataAnchor, templates]
  );

  return {
    startEditing,
    finishEditing,
    cancelEdit,
    discard: { pendingDiscardAction, requestDiscard, confirmDiscard, dismissDiscard, clearPending },
  };
};

export { useMetadataEditingLifecycle };
