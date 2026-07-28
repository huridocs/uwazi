import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import {
  buildEditEntityDefaultValues,
  useEntityMediaUpload,
  type EditEntityFormValues,
  type EditEntityErrors,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import { useEntityContext } from '../EntityContext.js';
import { resolveFormMountHost, type MetadataEditingHost } from '../metadataEditingSession.js';
import {
  EDIT_ENTITY_FORM_ID,
  type MetadataEditingActions,
  type MetadataEditingState,
} from '../metadataEditingTypes.js';

type MetadataActiveByHost = Record<MetadataEditingHost, boolean>;

const useMetadataEditingController = (): {
  state: MetadataEditingState;
  actions: MetadataEditingActions;
} => {
  const { entity } = useEntityContext();
  const templates = useAtomValue(templatesAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastMetadataAnchor, setLastMetadataAnchor] = useState<MetadataEditingHost | null>(null);
  const [metadataActiveByHost, setMetadataActiveByHost] = useState<MetadataActiveByHost>({
    main: false,
    side: false,
  });
  const metadataActiveByHostRef = useRef(metadataActiveByHost);
  metadataActiveByHostRef.current = metadataActiveByHost;
  const [saveError, setSaveError] = useState<string>();
  const [editErrors, setEditErrors] = useState<EditEntityErrors>();
  const cancelEditRef = useRef<(() => void) | null>(null);
  const saveAbortRef = useRef<AbortController | null>(null);
  const saveInFlightRef = useRef(false);
  const isEditingRef = useRef(false);
  isEditingRef.current = isEditing;

  const form = useForm<EditEntityFormValues>({
    defaultValues: buildEditEntityDefaultValues(entity, templates),
  });
  const templateId = form.watch('template');
  const mediaUpload = useEntityMediaUpload(entity, templateId);
  const { clearPendingAttachments } = mediaUpload;

  const formMountHost = isEditing
    ? resolveFormMountHost(metadataActiveByHost.main, metadataActiveByHost.side, lastMetadataAnchor)
    : null;

  const registerCancelEdit = useCallback((handler: () => void) => {
    cancelEditRef.current = handler;
    return () => {
      if (cancelEditRef.current === handler) cancelEditRef.current = null;
    };
  }, []);

  const tryBeginSave = useCallback((): AbortController | null => {
    if (saveInFlightRef.current) return null;
    saveInFlightRef.current = true;
    setIsSaving(true);
    saveAbortRef.current?.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;
    return controller;
  }, []);

  const endSave = useCallback(() => {
    saveInFlightRef.current = false;
    saveAbortRef.current = null;
    setIsSaving(false);
  }, []);

  const registerMetadataActive = useCallback((host: MetadataEditingHost, active: boolean) => {
    const prev = metadataActiveByHostRef.current;
    if (prev[host] === active) return;
    const next = { ...prev, [host]: active };
    metadataActiveByHostRef.current = next;
    setMetadataActiveByHost(next);
    if (active) {
      setLastMetadataAnchor(host);
    }
  }, []);

  const startEditing = useCallback(
    (host: MetadataEditingHost) => {
      if (!isEditingRef.current) {
        form.reset(buildEditEntityDefaultValues(entity, templates));
      }
      setLastMetadataAnchor(host);
      setIsEditing(true);
    },
    [entity, form, templates]
  );

  const finishEditing = useCallback(() => {
    saveInFlightRef.current = false;
    clearPendingAttachments();
    form.reset(buildEditEntityDefaultValues(entity, templates));
    setSaveError(undefined);
    setEditErrors(undefined);
    setIsDirty(false);
    setIsSaving(false);
    setIsEditing(false);
    setLastMetadataAnchor(null);
  }, [clearPendingAttachments, entity, form, templates]);

  const cancelEdit = useCallback(() => {
    saveAbortRef.current?.abort();
    saveAbortRef.current = null;
    saveInFlightRef.current = false;
    cancelEditRef.current?.();
    finishEditing();
  }, [finishEditing]);

  const state = useMemo(
    () => ({
      isEditing,
      isSaving,
      isDirty,
      lastMetadataAnchor,
      formMountHost,
      form,
      formId: EDIT_ENTITY_FORM_ID,
      mediaUpload,
      saveError,
      editErrors,
    }),
    [
      isEditing,
      isSaving,
      isDirty,
      lastMetadataAnchor,
      formMountHost,
      form,
      mediaUpload,
      saveError,
      editErrors,
    ]
  );
  const actions = useMemo(
    () => ({
      setIsSaving,
      setIsDirty,
      setSaveError,
      setEditErrors,
      startEditing,
      registerMetadataActive,
      finishEditing,
      registerCancelEdit,
      tryBeginSave,
      endSave,
      cancelEdit,
    }),
    [
      registerCancelEdit,
      tryBeginSave,
      endSave,
      registerMetadataActive,
      cancelEdit,
      startEditing,
      finishEditing,
    ]
  );

  return { state, actions };
};

export { useMetadataEditingController };
