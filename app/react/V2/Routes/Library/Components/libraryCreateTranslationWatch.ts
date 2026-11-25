import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';
import { mediaContextFromTemplate } from '#shared/entitySave/mediaContext.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  applyEntitySaveApiError,
  buildEditEntityDefaultValues,
  mapTemplateProperty,
  type EditEntityErrors,
  type EditEntityFormValues,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import { installedLanguageKeys } from '#V2/Components/Metadata/EntityEditor/functions/entityTranslations.js';
import type { EntitiesService, EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import { libraryHitFromEntity } from './libraryCreatedRows.js';
import { toNewEntitySaveInput } from './libraryCreateEntity.js';
import {
  createOmittedLanguages,
  readCreatedTranslations,
} from './libraryCreatePendingTranslations.js';

const CREATE_TRANSLATION_READS = 3;
const CREATE_TRANSLATION_WAIT_MS = 1000;

type LibraryTemplates = Parameters<typeof buildEditEntityDefaultValues>[1];
type LibraryForm = UseFormReturn<EditEntityFormValues>;
type GetBySharedId = EntitiesService['getBySharedId'];
type Created = (sharedId: string, row?: LibrarySearchHit) => void;

type CreateSession = {
  active: boolean;
  accepted: boolean;
  notified: boolean;
  onCreated: Created;
};

const createSession = (onCreated: Created): CreateSession => ({
  active: true,
  accepted: false,
  notified: false,
  onCreated,
});

const publishCreate = (session: CreateSession, saved: Entity) => {
  if (session.notified) return;
  session.notified = true;
  session.onCreated(saved.sharedId, libraryHitFromEntity(saved));
};

const releaseCreate = (session: CreateSession) => {
  session.active = false;
};

const fetchTranslationRows = async (saved: Entity, getBySharedId: GetBySharedId) => {
  try {
    const [rows, error] = await getBySharedId(saved.sharedId, {
      language: saved.language,
      omitRelationships: true,
    });
    return error ? 'error' : rows;
  } catch {
    return 'error';
  }
};

type TranslationWatch = {
  saved: Entity;
  omitted: readonly string[];
  getBySharedId: GetBySharedId;
};

const foundTranslation = async (
  attempt: number,
  watch: TranslationWatch
): Promise<EntityTranslationsDTO | undefined> => {
  if (attempt >= CREATE_TRANSLATION_READS) return undefined;
  await new Promise<void>(resolve => {
    setTimeout(resolve, CREATE_TRANSLATION_WAIT_MS);
  });
  const rows = await fetchTranslationRows(watch.saved, watch.getBySharedId);
  if (rows === 'error') return foundTranslation(attempt + 1, watch);
  const read = readCreatedTranslations(rows, watch.omitted, watch.saved.language);
  if (read.status === 'found') return read.translations;
  return foundTranslation(attempt + 1, watch);
};

const requestNewEntity = async ({
  input,
  entities,
  templates,
  form,
  session,
  setEditErrors,
  setSaveError,
}: {
  input: EntitySaveInput;
  entities: EntitiesService;
  templates: LibraryTemplates;
  form: LibraryForm;
  session: CreateSession;
  setEditErrors: (errors: EditEntityErrors | undefined) => void;
  setSaveError: (message: string | undefined) => void;
}) => {
  const template = templates.find(item => item._id === input.template);
  const [saved, error] = await entities.upsert(toNewEntitySaveInput(input), {
    saveMediaContext: template ? mediaContextFromTemplate(template) : undefined,
  });
  if (error || !saved?.sharedId) {
    if (session.active && error) {
      const failed = templates.find(item => item._id === form.getValues('template'));
      applyEntitySaveApiError({
        error,
        setEditErrors,
        setSaveError,
        metadataProperties: failed?.properties?.map(mapTemplateProperty) ?? [],
      });
    }
    return undefined;
  }
  return saved;
};

const finishNewEntity = async ({
  saved,
  input,
  session,
  languages,
  getBySharedId,
  onTranslated,
}: {
  saved: Entity;
  input: EntitySaveInput;
  session: CreateSession;
  languages: LanguagesListSchema | undefined;
  getBySharedId: GetBySharedId;
  onTranslated: (sharedId: string, translations: EntityTranslationsDTO) => void;
}) => {
  const omitted = createOmittedLanguages(
    input.translations,
    languages ? installedLanguageKeys(languages) : [],
    saved.language
  );
  if (session.active) publishCreate(session, saved);
  if (omitted.length === 0) return;
  const found = await foundTranslation(0, { saved, omitted, getBySharedId });
  if (found) onTranslated(saved.sharedId, found);
};

const useHeldCreate = (onCreated: Created) => {
  const session = useRef(createSession(onCreated));
  session.current.onCreated = onCreated;
  useEffect(() => {
    const { current } = session;
    current.active = true;
    return () => releaseCreate(current);
  }, []);
  return session;
};

export { finishNewEntity, requestNewEntity, useHeldCreate };
