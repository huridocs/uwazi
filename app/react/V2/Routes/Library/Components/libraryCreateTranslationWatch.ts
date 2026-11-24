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
  withFoundTranslations,
} from './libraryCreatePendingTranslations.js';

const CREATE_TRANSLATION_READS = 3;
const CREATE_TRANSLATION_WAIT_MS = 1000;

type LibraryTemplates = Parameters<typeof buildEditEntityDefaultValues>[1];
type LibraryForm = UseFormReturn<EditEntityFormValues>;
type GetBySharedId = EntitiesService['getBySharedId'];
type Created = (sharedId: string, row?: LibrarySearchHit) => void;

type PendingWait = {
  id: ReturnType<typeof setTimeout>;
  done: () => void;
};

type CreateSession = {
  active: boolean;
  accepted: boolean;
  token: number;
  notified: boolean;
  waits: PendingWait[];
  onCreated: Created;
};

type WatchContext = {
  session: CreateSession;
  token: number;
  saved: Entity;
  blank: Entity;
  form: LibraryForm;
  templates: LibraryTemplates;
  omitted: readonly string[];
  getBySharedId: GetBySharedId;
};

const createSession = (onCreated: Created): CreateSession => ({
  active: true,
  accepted: false,
  token: 0,
  notified: false,
  waits: [],
  onCreated,
});

const publishCreate = (session: CreateSession, saved: Entity) => {
  if (session.notified) return;
  session.notified = true;
  session.onCreated(saved.sharedId, libraryHitFromEntity(saved));
};

const releaseWaits = (waits: PendingWait[]) => {
  waits.forEach(wait => {
    clearTimeout(wait.id);
    wait.done();
  });
  waits.length = 0;
};

const releaseCreate = (session: CreateSession) => {
  session.active = false;
  session.token += 1;
  releaseWaits(session.waits);
};

const pauseFor = async (waits: PendingWait[], ms: number) =>
  new Promise<void>(resolve => {
    const pending: PendingWait = {
      id: setTimeout(() => {
        const index = waits.indexOf(pending);
        if (index >= 0) waits.splice(index, 1);
        resolve();
      }, ms),
      done: resolve,
    };
    waits.push(pending);
  });

const stillWatching = (session: CreateSession, token: number) =>
  session.active && session.token === token;

const fetchTranslationRows = async (ctx: WatchContext) => {
  try {
    const [rows, error] = await ctx.getBySharedId(ctx.saved.sharedId, {
      language: ctx.saved.language,
      omitRelationships: true,
    });
    return error ? 'error' : rows;
  } catch {
    return 'error';
  }
};

const applyFoundTranslations = (ctx: WatchContext, found: EntityTranslationsDTO) => {
  const encoded = buildEditEntityDefaultValues(
    { ...ctx.blank, template: ctx.saved.template, translations: found },
    ctx.templates
  ).translations;
  ctx.form.setValue(
    'translations',
    withFoundTranslations(ctx.form.getValues('translations'), encoded),
    {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    }
  );
};

const nextTranslationRows = async (ctx: WatchContext) => {
  if (!stillWatching(ctx.session, ctx.token)) return undefined;
  await pauseFor(ctx.session.waits, CREATE_TRANSLATION_WAIT_MS);
  if (!stillWatching(ctx.session, ctx.token)) return undefined;
  return fetchTranslationRows(ctx);
};

const takeTranslationRead = async (
  attempt: number,
  failures: number,
  ctx: WatchContext
): Promise<'empty' | 'found' | 'left' | 'unavailable'> => {
  if (!stillWatching(ctx.session, ctx.token)) return 'left';
  if (attempt >= CREATE_TRANSLATION_READS) return failures > 0 ? 'unavailable' : 'empty';
  const rows = await nextTranslationRows(ctx);
  if (!stillWatching(ctx.session, ctx.token)) return 'left';
  if (rows === 'error') return takeTranslationRead(attempt + 1, failures + 1, ctx);
  const read = readCreatedTranslations(rows, ctx.omitted, ctx.saved.language);
  if (read.status === 'found') {
    applyFoundTranslations(ctx, read.translations);
    return 'found';
  }
  return takeTranslationRead(attempt + 1, failures, ctx);
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
  blank,
  form,
  templates,
  languages,
  getBySharedId,
}: {
  saved: Entity;
  input: EntitySaveInput;
  session: CreateSession;
  blank: Entity;
  form: LibraryForm;
  templates: LibraryTemplates;
  languages: LanguagesListSchema | undefined;
  getBySharedId: GetBySharedId;
}) => {
  if (!session.active) return;
  const omitted = createOmittedLanguages(
    input.translations,
    languages ? installedLanguageKeys(languages) : [],
    saved.language
  );
  session.token += 1;
  const { token } = session;
  releaseWaits(session.waits);
  if (omitted.length === 0) return publishCreate(session, saved);
  const outcome = await takeTranslationRead(0, 0, {
    session,
    token,
    saved,
    blank,
    form,
    templates,
    omitted,
    getBySharedId,
  });
  if (outcome === 'empty' && stillWatching(session, token)) publishCreate(session, saved);
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
