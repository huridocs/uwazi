import _ from 'lodash';

import entities from 'api/entities';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EventsBus } from 'api/eventsbus';
import { files } from 'api/files';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import settings from 'api/settings';
import templates from 'api/templates';
import { TemplateDeletedEvent } from 'api/templates/events/TemplateDeletedEvent';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { shallowObjectDiff } from 'shared/data_utils/shallowObjectDiff';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXExtractorType } from 'shared/types/extractorType';
import { EnforcedWithId } from 'api/odm';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { Suggestions } from './suggestions';
import { getBlankSuggestion } from './blankSuggestions';

const featureIsEnabled = async () => {
  const configuration = await settings.get();
  return !!configuration.features?.metadataExtraction;
};

const extractedMetadataChanged = async (
  existingEntity: EntitySchema,
  newEntity: EntitySchema,
  extractors: IXExtractorType[]
) => {
  if (!extractors.length || !newEntity.metadata) return false;
  const templatesByProperty = objectIndex(
    extractors,
    e => e.property,
    e => new Set(e.templates.map(t => t.toString()))
  );
  const changedMetadata = shallowObjectDiff(newEntity.metadata, existingEntity.metadata || {}).all;
  if (newEntity.title !== existingEntity.title) changedMetadata.push('title');
  if (!existingEntity.template) return false;
  for (let i = 0; i < changedMetadata.length; i += 1) {
    const property = changedMetadata[i];
    if (
      property in templatesByProperty &&
      templatesByProperty[property].has(existingEntity.template.toString())
    ) {
      return true;
    }
  }
  return false;
};

const createDefaultSuggestionsForFiles = async (
  fileList: EnforcedWithId<FileType>[],
  entityTemplateId: ObjectIdSchema,
  extractorsInvolved: IXExtractorType[],
  defaultLanguage: string
) => {
  const blankSuggestions: IXSuggestionType[] = [];

  const template = await templates.getById(entityTemplateId);
  const extractorPropertySet = new Set(extractorsInvolved.map(e => e.property));
  const involvedProperties =
    template!.properties?.filter(p => extractorPropertySet.has(p.name)) || [];
  const involvedPropertiesByName = objectIndex(
    involvedProperties,
    p => p.name,
    p => p
  );

  fileList.forEach(file => {
    extractorsInvolved.forEach(extractor => {
      const propertyType = involvedPropertiesByName[extractor.property]?.type;
      if (file.entity) {
        blankSuggestions.push(
          getBlankSuggestion(file, extractor, entityTemplateId, propertyType, defaultLanguage)
        );
      }
    });
  });

  await Suggestions.saveMultiple(blankSuggestions);
};

const handleTemplateChange = async (
  originalDoc: EntitySchema,
  modifiedDoc: EntitySchema,
  extractors: IXExtractorType[]
) => {
  const originalTemplateId = originalDoc.template!.toString();
  const modifiedTemplateId = modifiedDoc.template!.toString();

  if (originalTemplateId === modifiedTemplateId) return;

  await Suggestions.delete({ entityId: modifiedDoc.sharedId });

  const extractorsForEntity = extractors.filter(extractor =>
    extractor.templates.map(templateId => templateId.toString()).includes(modifiedTemplateId)
  );

  if (extractorsForEntity.length) {
    const docFiles = await files.get({ entity: modifiedDoc.sharedId, type: 'document' });
    const defaultLanguage = (await settings.getDefaultLanguage()).key;
    await createDefaultSuggestionsForFiles(
      docFiles,
      modifiedTemplateId,
      extractorsForEntity,
      defaultLanguage
    );
  }
};

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(EntityUpdatedEvent, async ({ before, after, targetLanguageKey }) => {
    if (!(await featureIsEnabled())) return;

    const originalDoc = before.find(doc => doc.language === targetLanguageKey)!;
    const modifiedDoc = after.find(doc => doc.language === targetLanguageKey)!;

    const extractors = await Extractors.get();
    if (await extractedMetadataChanged(originalDoc, modifiedDoc, extractors)) {
      await Suggestions.updateStates({ entityId: originalDoc.sharedId });
    }
    await handleTemplateChange(originalDoc, modifiedDoc, extractors);
  });

  eventsBus.on(FileCreatedEvent, async ({ newFile }) => {
    if (!(await featureIsEnabled())) return;

    if (newFile.entity && newFile.type === 'document') {
      const entityTemplateId = (
        await entities.get({ sharedId: newFile.entity }, 'template')
      )[0].template.toString();

      const extractors = await Extractors.get();
      const extractorsForEntity = extractors.filter(extractor =>
        extractor.templates.map(templateId => templateId.toString()).includes(entityTemplateId)
      );

      if (extractorsForEntity.length) {
        const defaultLanguage = await settings.getDefaultLanguage();
        await createDefaultSuggestionsForFiles(
          [newFile],
          entityTemplateId,
          extractorsForEntity,
          defaultLanguage.key
        );
      }
    }
  });

  eventsBus.on(EntityDeletedEvent, async ({ entity }) => {
    if (!(await featureIsEnabled())) return;
    await Suggestions.deleteByEntityId(entity[0].sharedId!);
  });

  eventsBus.on(FileUpdatedEvent, async ({ before, after }) => {
    if (!(await featureIsEnabled())) return;
    if (!_.isEqual(before.extractedMetadata, after.extractedMetadata)) {
      await Suggestions.updateStates({ fileId: after._id });
    }
  });

  eventsBus.on(FilesDeletedEvent, async ({ files: _files }) => {
    if (!(await featureIsEnabled())) return;
    await Suggestions.delete({ fileId: { $in: _files.map(f => f._id) } });
  });

  eventsBus.on(TemplateUpdatedEvent, async ({ after }) => {
    if (!(await featureIsEnabled())) return;
    const templatePropertyNames = after.properties?.map(p => p.name) || ['title'];
    await Extractors.cleanupTemplateFromPropertyExtractors(after._id!.toString(), [
      ...templatePropertyNames,
      'title',
    ]);
  });

  eventsBus.on(TemplateDeletedEvent, async ({ templateId }) => {
    if (!(await featureIsEnabled())) return;
    await Extractors.cleanupTemplateFromPropertyExtractors(templateId, []);
  });
};

export { registerEventListeners };
