import {
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { buildEditEntityDefaultValues } from '#V2/Components/Metadata/EntityEditor/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import { useServices } from '#V2/services/index.js';
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

type EditTemplates = Parameters<typeof buildEditEntityDefaultValues>[1];
type EditingForm = ReturnType<typeof useMetadataEditingForm>['form'];

type LoadedEditRefs = {
  entity: Entity;
  templates: EditTemplates;
  request: number;
  cancel: () => void;
};

type SharedEdit = {
  host: MetadataEditingHost;
  refs: MutableRefObject<LoadedEditRefs>;
  getBySharedId: EntitiesService['getBySharedId'];
  form: EditingForm;
  setEditBase: Dispatch<SetStateAction<Entity | undefined>>;
  setEditing: Dispatch<SetStateAction<boolean>>;
  setAnchor: (host: MetadataEditingHost) => void;
  setSaveError: Dispatch<SetStateAction<string | undefined>>;
};

const LOAD_ERROR = 'Could not load the entity';

const fetchEditRow = async (
  getBySharedId: EntitiesService['getBySharedId'],
  sharedId: string,
  language: string
): Promise<Entity> => {
  const [rows, error] = await getBySharedId(sharedId, { language, omitRelationships: false });
  const row = rows?.find(candidate => candidate.language === language) ?? rows?.[0];
  if (error || !row) {
    throw new Error(error?.message || LOAD_ERROR);
  }
  return row;
};

const blockedEdit = (saving: boolean, editing: boolean, edit: SharedEdit) => {
  if (saving) return true;
  if (!editing) return false;
  edit.setAnchor(edit.host);
  return true;
};

const openBlankEdit = (edit: SharedEdit, current: Entity) => {
  edit.form.reset(buildEditEntityDefaultValues(current, edit.refs.current.templates));
  edit.setAnchor(edit.host);
  edit.setEditing(true);
};

const showLoadedRow = (row: Entity, edit: SharedEdit) => {
  edit.setEditBase(row);
  openBlankEdit(edit, row);
};

const loadSharedEdit = async (edit: SharedEdit) => {
  const requestId = edit.refs.current.request + 1;
  edit.refs.current.request = requestId;
  const { sharedId, language } = edit.refs.current.entity;
  const still = () =>
    edit.refs.current.request === requestId &&
    edit.refs.current.entity.sharedId === sharedId &&
    edit.refs.current.entity.language === language;
  try {
    const row = await fetchEditRow(edit.getBySharedId, sharedId, language);
    if (!still()) return;
    showLoadedRow(row, edit);
  } catch (caught) {
    if (!still()) return;
    edit.setSaveError(caught instanceof Error && caught.message ? caught.message : LOAD_ERROR);
  }
};

const useLoadedEdit = (entity: Entity, templates: EditTemplates) => {
  const { entities } = useServices();
  const refs = useRef<LoadedEditRefs>({
    entity,
    templates,
    request: 0,
    cancel: () => undefined,
  });
  refs.current.entity = entity;
  refs.current.templates = templates;
  return { getBySharedId: entities.getBySharedId, refs };
};

const useMetadataEditingLifecycle = ({
  flags: { setIsDirty, setIsEditing, isEditingRef, isDirtyRef, setTranslationsPending },
  save: { abortSave, setIsSaving, saveInFlightRef },
  hosts: { setLastMetadataAnchor },
  formSession: {
    entity,
    templates,
    form,
    mediaUpload,
    setSaveError,
    setEditErrors,
    setEditBase,
    formCancelRef,
  },
  cancelTranslations,
}: LifecycleDeps) => {
  const { getBySharedId, refs } = useLoadedEdit(entity, templates);
  const runCancelEdit = useCallback(() => {
    refs.current.cancel();
  }, [refs]);
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
    const close = () => {
      refs.current.request += 1;
      setEditBase(undefined);
      saveInFlightRef.current = false;
      mediaUpload.clearPendingAttachments();
      form.reset(buildEditEntityDefaultValues(entity, templates));
      setSaveError(undefined);
      setEditErrors(undefined);
      setIsDirty(false);
      setIsSaving(false);
    };
    close();
    stopEditing();
    clearPending();
    setLastMetadataAnchor(null);
  }, [
    clearPending,
    entity,
    form,
    mediaUpload,
    refs,
    saveInFlightRef,
    setEditBase,
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
  refs.current.cancel = cancelEdit;

  const startEditing = useCallback(
    (host: MetadataEditingHost) => {
      const edit: SharedEdit = {
        host,
        refs,
        getBySharedId,
        form,
        setEditBase,
        setEditing: setIsEditing,
        setAnchor: setLastMetadataAnchor,
        setSaveError,
      };
      if (blockedEdit(saveInFlightRef.current, isEditingRef.current, edit)) return;
      const current = refs.current.entity;
      setSaveError(undefined);
      if (!current.sharedId) {
        openBlankEdit(edit, current);
        return;
      }
      void loadSharedEdit(edit);
    },
    [
      form,
      getBySharedId,
      isEditingRef,
      refs,
      saveInFlightRef,
      setEditBase,
      setIsEditing,
      setLastMetadataAnchor,
      setSaveError,
    ]
  );

  return {
    startEditing,
    finishEditing,
    cancelEdit,
    discard: { pendingDiscardAction, requestDiscard, confirmDiscard, dismissDiscard, clearPending },
  };
};

export { useMetadataEditingLifecycle };
