import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  beginEntitySave,
  buildEditEntityDefaultValues,
  useEntityMediaUpload,
  type EditEntityErrors,
  type EditEntityFormValues,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import { useServices } from '#V2/services/index.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { libraryHitFromEntity } from './libraryCreatedRows.js';
import { blankLibraryEntity, defaultLibraryTemplateId } from './libraryCreateEntity.js';
import {
  finishNewEntity,
  requestNewEntity,
  useHeldCreate,
} from './libraryCreateTranslationWatch.js';

const CREATE_FORM_ID = 'library-create-entity-form';

type NotedEntity = (sharedId: string, row?: LibrarySearchHit) => void;

const clearRejectedCreate = (
  session: { accepted: boolean; active: boolean },
  setSaving: (saving: boolean) => void
) => {
  session.accepted = false;
  if (session.active) setSaving(false);
};

const keepCreatedForm = ({
  session,
  form,
  setCreated,
  setSaving,
}: {
  session: { active: boolean };
  form: ReturnType<typeof useForm<EditEntityFormValues>>;
  setCreated: (created: boolean) => void;
  setSaving: (saving: boolean) => void;
}) => {
  if (!session.active) return false;
  form.reset(form.getValues());
  setCreated(true);
  setSaving(false);
  return true;
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

const useLibraryCreateEntity = (onCreated: NotedEntity, onNoted: NotedEntity = () => undefined) => {
  const { entities } = useServices();
  const settings = useAtomValue(settingsAtom);
  const { templates, entity, form, mediaUpload } = useLibraryCreateEntityForm();
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [editErrors, setEditErrors] = useState<EditEntityErrors>();
  const session = useHeldCreate(onCreated);

  const onSave = async (input: EntitySaveInput) => {
    const { current } = session;
    if (current.accepted) return;
    current.accepted = true;
    setSaving(true);
    beginEntitySave({ setSaveError, setEditErrors, clearErrors: form.clearErrors });
    const saved = await requestNewEntity({
      input,
      entities,
      templates,
      form,
      session: current,
      setEditErrors,
      setSaveError,
    });
    if (!saved) return clearRejectedCreate(current, setSaving);
    onNoted(saved.sharedId, libraryHitFromEntity(saved));
    if (!keepCreatedForm({ session: current, form, setCreated, setSaving })) return;
    await finishNewEntity({
      saved,
      input,
      session: current,
      blank: entity,
      form,
      templates,
      languages: settings.languages,
      getBySharedId: entities.getBySharedId,
    });
  };

  return {
    entity,
    form,
    formId: CREATE_FORM_ID,
    mediaUpload,
    saving,
    created,
    saveError,
    editErrors,
    onSave,
  };
};

export { CREATE_FORM_ID, useLibraryCreateEntity };
