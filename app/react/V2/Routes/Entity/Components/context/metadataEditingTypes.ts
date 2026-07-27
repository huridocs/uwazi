import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { EditEntityFormValues } from '#V2/Components/Metadata/EntityEditor/functions/buildEditEntityDefaultValues.js';
import type { EditEntityErrors } from '#V2/Components/Metadata/EntityEditor/functions/editEntityErrors.js';
import type { EntityMediaUpload } from '#V2/Components/Metadata/EntityEditor/hooks/useEntityMediaUpload.js';
import type { MetadataEditingHost } from './metadataEditingSession.js';

const EDIT_ENTITY_FORM_ID = 'edit-entity-form' as const;

type MetadataEditingState = {
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastMetadataAnchor: MetadataEditingHost | null;
  formMountHost: MetadataEditingHost | null;
  form: UseFormReturn<EditEntityFormValues>;
  formId: typeof EDIT_ENTITY_FORM_ID;
  mediaUpload: EntityMediaUpload;
  saveError?: string;
  editErrors?: EditEntityErrors;
};

type MetadataEditingActions = {
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setIsDirty: Dispatch<SetStateAction<boolean>>;
  setSaveError: Dispatch<SetStateAction<string | undefined>>;
  setEditErrors: Dispatch<SetStateAction<EditEntityErrors | undefined>>;
  startEditing: (host: MetadataEditingHost) => void;
  registerMetadataActive: (host: MetadataEditingHost, active: boolean) => void;
  finishEditing: () => void;
  registerCancelEdit: (handler: () => void) => () => void;
  beginSaveAbort: () => AbortController;
  clearSaveAbort: () => void;
  cancelEdit: () => void;
};

export { EDIT_ENTITY_FORM_ID };
export type { MetadataEditingState, MetadataEditingActions };
