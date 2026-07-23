import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import entities from '#api/entities/entities.js';
import { savePropertySelections } from '#api/entities/metadataExtraction/saveSelections.js';
import { validateEntity } from '#api/entities/validateEntity.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import date from '#api/utils/date.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { User } from '#api/users.v2/model/User.js';
import ID from '#shared/uniqueID.js';
import { denormalizeMetadata } from '../denormalize.js';
import { normalizeLegacyEntityForFacade, sanitizeForTemplate } from '../legacyMutationCommon.js';

const toActorFromUser = user =>
  user?._id
    ? User.createFrom({
        _id: user._id,
        role: 'editor',
        groups: [],
        email: 'editor@test.com',
        username: 'editorUser',
      })
    : undefined;

const getEntityTemplate = async (doc, language) => {
  if (doc.template) {
    return templates.getById(doc.template);
  }
  if (doc.sharedId) {
    const storedDoc =
      (await entities.getById(doc.sharedId, language)) || (await entities.getById(doc.sharedId));
    if (storedDoc?.template) {
      return templates.getById(storedDoc.template);
    }
  }
  return null;
};

const initializeEntityForSave = ({ doc, user }) => {
  if (doc.sharedId) {
    return { ...doc };
  }
  return {
    ...doc,
    user: user._id,
    creationDate: date.currentUTC(),
    published: false,
  };
};

const updateExistingEntity = async ({ entityToSave, language, template }) => {
  const docLanguage = entityToSave.language || language;
  const [languageDocWithFiles] = await entities.getUnrestrictedWithDocuments(
    { sharedId: entityToSave.sharedId, language: docLanguage },
    '+permissions'
  );
  const [anyLanguageDocWithFiles] = await entities.getUnrestrictedWithDocuments(
    { sharedId: entityToSave.sharedId },
    '+permissions'
  );
  const currentDoc = languageDocWithFiles || anyLanguageDocWithFiles;
  if (!currentDoc) {
    throw new Error(`entity does not exists: ${entityToSave.sharedId}`);
  }

  const sanitized = sanitizeForTemplate(entityToSave, template);
  const merged = {
    ...currentDoc,
    ...sanitized,
    _id: sanitized._id || currentDoc._id,
    sharedId: sanitized.sharedId || currentDoc.sharedId,
    language: sanitized.language || currentDoc.language || docLanguage,
    title: sanitized.title || currentDoc.title,
  };
  await EntityFacade.update(normalizeLegacyEntityForFacade(merged), merged.language || language);
};

const createNewEntity = async ({ entityToSave, language, template }) => {
  const defaultTemplate = entityToSave.template ? null : await templates.getDefaultTemplate();
  const templateToUse = template || defaultTemplate;
  const entityWithTemplate = {
    ...entityToSave,
    template: entityToSave.template || defaultTemplate?._id,
    metadata: entityToSave.metadata || {},
  };
  const { _id: _ignoredId, ...entityWithoutMongoId } = entityWithTemplate;
  const createdEntity = await EntityFacade.create(
    normalizeLegacyEntityForFacade(sanitizeForTemplate(entityWithoutMongoId, templateToUse)),
    language
  );
  return createdEntity.sharedId;
};

const resolveContextOptions = ({ user, runWithContextOptions }) => {
  const actor = toActorFromUser(user);
  return {
    ...runWithContextOptions,
    ...(actor ? { actor } : {}),
    ...(runWithContextOptions.factories ? { factories: runWithContextOptions.factories } : {}),
  };
};

const loadSavedEntity = async ({ sharedId, language }) => {
  const [entity] = await entities.getUnrestrictedWithDocuments(
    { sharedId, language },
    '+permissions'
  );
  return entity;
};

const persistEntity = async ({ entityToSave, language, template }) => {
  if (entityToSave.sharedId) {
    await updateExistingEntity({ entityToSave, language, template });
    return entityToSave.sharedId;
  }
  return createNewEntity({ entityToSave, language, template });
};

const saveEntityV2Adapter = (doc, { user, language }, runWithContextOptions = {}) => {
  const contextOptions = resolveContextOptions({ user, runWithContextOptions });

  const runSave = async () => {
    await validateEntity(doc);
    await savePropertySelections(doc);

    const entityToSave = {
      ...initializeEntityForSave({ doc, user }),
      editDate: date.currentUTC(),
    };
    const template = await getEntityTemplate(entityToSave, language);
    const sharedId = await persistEntity({ entityToSave, language, template });
    return loadSavedEntity({ sharedId, language });
  };

  if (ExecutionContext.getStore()) {
    return runSave();
  }

  return testingEnvironment.runWithContext(
    runSave,
    Object.keys(contextOptions).length ? contextOptions : undefined
  );
};

const denormalizeEntityV2Adapter = (_doc, { user, language }) =>
  testingEnvironment.runWithContext(async () => {
    await validateEntity(_doc);
    const doc = initializeEntityForSave({ doc: _doc, user });
    doc.sharedId = doc.sharedId || ID();
    const [template, defaultTemplate] = await Promise.all([
      getEntityTemplate(doc, language),
      templates.getDefaultTemplate(),
    ]);
    const docTemplate = doc.template ? template : defaultTemplate;
    const entity = sanitizeForTemplate(doc, docTemplate);
    entity.metadata = await denormalizeMetadata(entity.metadata, entity.language, docTemplate);
    return entity;
  });

export { denormalizeEntityV2Adapter, getEntityTemplate, saveEntityV2Adapter, toActorFromUser };
