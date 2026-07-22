import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import entities from '#api/entities/entities.js';
import { savePropertySelections } from '#api/entities/metadataExtraction/saveSelections.js';
import { validateEntity } from '#api/entities/validateEntity.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import date from '#api/utils/date.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { User } from '#api/users.v2/model/User.js';
import ID from '#shared/uniqueID.js';

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

const asStringId = value => {
  if (value === null || value === undefined) {
    return value;
  }
  return typeof value === 'string' ? value : value.toString();
};

const normalizeIcon = icon => {
  if (!icon) {
    return icon;
  }
  return {
    ...icon,
    _id: icon._id === null ? null : asStringId(icon._id),
  };
};

const normalizeDocuments = (documents = []) =>
  documents
    .filter(document => document?.originalname)
    .map(document => ({
      ...document,
      _id: asStringId(document._id),
    }))
    .filter(document => document._id);

const normalizeAttachments = (attachments = []) =>
  attachments
    .filter(attachment => attachment?.originalname)
    .map(attachment => ({
      ...attachment,
      _id: attachment._id ? asStringId(attachment._id) : undefined,
    }));

const normalizeLegacyEntityForFacade = entity => ({
  ...entity,
  _id: asStringId(entity._id),
  user: asStringId(entity.user),
  template: asStringId(entity.template),
  icon: normalizeIcon(entity.icon),
  documents: normalizeDocuments(entity.documents),
  attachments: normalizeAttachments(entity.attachments),
});

const saveEntityV2Adapter = (doc, { user, language }, runWithContextOptions = {}) => {
  const actor = toActorFromUser(user);
  const contextOptions = {
    ...runWithContextOptions,
    ...(actor ? { actor } : {}),
    ...(runWithContextOptions.factories ? { factories: runWithContextOptions.factories } : {}),
  };

  return testingEnvironment.runWithContext(
    // eslint-disable-next-line max-statements
    async () => {
      await validateEntity(doc);
      await savePropertySelections(doc);

      const entityToSave = { ...doc };
      if (!entityToSave.sharedId) {
        entityToSave.user = user._id;
        entityToSave.creationDate = date.currentUTC();
        entityToSave.published = false;
      }

      let sharedId = entityToSave.sharedId || ID();
      const template = await entities.getEntityTemplate(entityToSave, language);
      let docTemplate = template;
      entityToSave.editDate = date.currentUTC();

      if (entityToSave.sharedId) {
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

        const sanitized = entities.sanitize(entityToSave, template);
        const merged = {
          ...currentDoc,
          ...sanitized,
          _id: sanitized._id || currentDoc._id,
          sharedId: sanitized.sharedId || currentDoc.sharedId,
          language: sanitized.language || currentDoc.language || docLanguage,
          title: sanitized.title || currentDoc.title,
        };
        await EntityFacade.update(
          normalizeLegacyEntityForFacade(merged),
          merged.language || language
        );
      } else {
        const defaultTemplate = await templates.getDefaultTemplate();
        if (!entityToSave.template) {
          entityToSave.template = defaultTemplate?._id;
          docTemplate = defaultTemplate;
        }
        if (entityToSave._id) {
          delete entityToSave._id;
        }
        entityToSave.metadata = entityToSave.metadata || {};
        const createdEntity = await EntityFacade.create(
          normalizeLegacyEntityForFacade(entities.sanitize(entityToSave, docTemplate)),
          language
        );
        sharedId = createdEntity.sharedId;
      }

      const [entity] = await entities.getUnrestrictedWithDocuments(
        { sharedId, language },
        '+permissions'
      );
      return entity;
    },
    Object.keys(contextOptions).length ? contextOptions : undefined
  );
};

export { saveEntityV2Adapter, toActorFromUser };
