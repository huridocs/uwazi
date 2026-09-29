import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import type { ApiError } from '#shared/apiClient/index.js';
import { mediaContextFromTemplate } from '#shared/entitySave/mediaContext.js';
import { localeAtom, templatesAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  apiValidationsToEditEntityErrors,
  buildEditEntityDefaultValues,
  useEntityMediaUpload,
  type EditEntityErrors,
  type EditEntityFormValues,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import { useServices } from '#V2/services/index.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import {
  blankLibraryEntity,
  defaultLibraryTemplateId,
  toNewEntitySaveInput,
} from './libraryCreateEntity.js';

const CREATE_FORM_ID = 'library-create-entity-form';

type NewEntitySaveResult = {
  saved?: Entity;
  error?: ApiError;
  onCreated: (sharedId: string) => void;
  setEditErrors: (errors: EditEntityErrors | undefined) => void;
  setSaveError: (message: string | undefined) => void;
};

const applyNewEntitySaveResult = ({
  saved,
  error,
  onCreated,
  setEditErrors,
  setSaveError,
}: NewEntitySaveResult) => {
  if (error) {
    if (error.kind === 'cancelled') return;
    const fieldErrors = apiValidationsToEditEntityErrors(error.validations);
    setEditErrors(fieldErrors);
    if (!fieldErrors) setSaveError(error.detail ?? error.message);
    return;
  }
  if (saved?.sharedId) onCreated(saved.sharedId);
};

const useLibraryCreateEntityForm = () => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom) || 'en';
  const entity = useMemo(
    () => blankLibraryEntity(defaultLibraryTemplateId(templates), locale),
    [locale, templates]
  );
  const form = useForm<EditEntityFormValues>({
    defaultValues: buildEditEntityDefaultValues(entity, templates),
  });
  const mediaUpload = useEntityMediaUpload(undefined, form.watch('template'));
  return { templates, entity, form, mediaUpload };
};

const useLibraryCreateEntity = (onCreated: (sharedId: string) => void) => {
  const { entities } = useServices();
  const { templates, entity, form, mediaUpload } = useLibraryCreateEntityForm();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [editErrors, setEditErrors] = useState<EditEntityErrors>();

  const onSave = async (input: EntitySaveInput) => {
    setSaving(true);
    setSaveError(undefined);
    setEditErrors(undefined);
    try {
      const template = templates.find(item => item._id === input.template);
      const [saved, error] = await entities.upsert(toNewEntitySaveInput(input), {
        saveMediaContext: template ? mediaContextFromTemplate(template) : undefined,
      });
      applyNewEntitySaveResult({ saved, error, onCreated, setEditErrors, setSaveError });
    } finally {
      setSaving(false);
    }
  };

  return {
    entity,
    form,
    formId: CREATE_FORM_ID,
    mediaUpload,
    saving,
    saveError,
    editErrors,
    onSave,
  };
};

export { CREATE_FORM_ID, useLibraryCreateEntity };
