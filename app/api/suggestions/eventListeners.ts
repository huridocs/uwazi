import _ from 'lodash';

import entities from 'api/entities';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EventsBus } from 'api/eventsbus';
import { files } from 'api/files';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import settings from 'api/settings';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { shallowObjectDiff } from 'shared/data_utils/shallowObjectDiff';
import { ensure } from 'shared/tsUtils';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import ixextractors from 'api/services/informationextraction/ixextractors';
import { TemplateDeletedEvent } from 'api/templates/events/TemplateDeletedEvent';
import { createDefaultSuggestionsForFiles } from './configurationManager';
import { Suggestions } from './suggestions';

type extractionTemplateType =
  | {
      template: ObjectIdSchema;
      properties: string[];
    }[]
  | undefined;

const extractedMetadataChanged = async (
  existingEntity: EntitySchema,
  newEntity: EntitySchema,
  extractionTemplates: extractionTemplateType
) => {
  if (!extractionTemplates || !newEntity.metadata) return false;
  const extractionTemplatesIndexed = objectIndex(
    extractionTemplates,
    d => d.template.toString(),
    d => new Set(d.properties)
  );
  if (!existingEntity || !(existingEntity.template!.toString() in extractionTemplatesIndexed)) {
    return false;
  }
  const extractedProperties = extractionTemplatesIndexed[existingEntity.template!.toString()];
  const changedMetadata = shallowObjectDiff(newEntity.metadata, existingEntity.metadata || {}).all;
  if (newEntity.title !== existingEntity.title) changedMetadata.push('title');
  return changedMetadata.some(m => extractedProperties.has(m));
};

const handleTemplateChange = async (
  originalDoc: EntitySchema,
  modifiedDoc: EntitySchema,
  extractionTemplates: extractionTemplateType
) => {
  const originalTemplateId = originalDoc.template?.toString();
  const modifiedTemplateId = modifiedDoc.template?.toString();
  if (originalTemplateId === modifiedTemplateId) return;
  const modifiedTemplateInSettings = extractionTemplates?.find(
    t => t.template === modifiedTemplateId
  );
  await Suggestions.delete({ entityId: modifiedDoc.sharedId });
  if (modifiedTemplateInSettings) {
    const docFiles = await files.get({ entity: modifiedDoc.sharedId, type: 'document' });
    const defaultLanguage = (await settings.getDefaultLanguage()).key;
    await createDefaultSuggestionsForFiles(docFiles, modifiedTemplateInSettings, defaultLanguage);
  }
};

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(EntityUpdatedEvent, async ({ before, after, targetLanguageKey }) => {
    const originalDoc = before.find(doc => doc.language === targetLanguageKey)!;
    const modifiedDoc = after.find(doc => doc.language === targetLanguageKey)!;

    const extractionTemplates = (await settings.get({})).features?.metadataExtraction?.templates;
    if (await extractedMetadataChanged(originalDoc, modifiedDoc, extractionTemplates)) {
      await Suggestions.updateStates({ entityId: originalDoc.sharedId });
    }
    await handleTemplateChange(originalDoc, modifiedDoc, extractionTemplates);
  });

  eventsBus.on(FileCreatedEvent, async ({ newFile }) => {
    if (newFile.entity && newFile.type === 'document') {
      const { languages, features } = await settings.get({}, 'languages features');
      const entityTemplateId = (
        await entities.get({ sharedId: newFile.entity }, 'template')
      )[0].template.toString();
      const settingsTemplate = features?.metadataExtraction?.templates?.find(
        t => t.template === entityTemplateId
      );
      if (settingsTemplate) {
        const defaultLanguage = ensure<string>(languages?.find(lang => lang.default)?.key);
        await createDefaultSuggestionsForFiles([newFile], settingsTemplate, defaultLanguage);
      }
    }
  });

  eventsBus.on(EntityDeletedEvent, async ({ entity }) => {
    await Suggestions.deleteByEntityId(entity[0].sharedId!);
  });

  eventsBus.on(FileUpdatedEvent, async ({ before, after }) => {
    if (!_.isEqual(before.extractedMetadata, after.extractedMetadata)) {
      await Suggestions.updateStates({ fileId: after._id });
    }
  });

  eventsBus.on(FilesDeletedEvent, async ({ files: _files }) => {
    await Suggestions.delete({ fileId: { $in: _files.map(f => f._id) } });
  });

  eventsBus.on(TemplateUpdatedEvent, async ({ after }) => {
    const templatePropertyNames = after.properties?.map(p => p.name) || ['title'];
    await ixextractors.cleanupTemplateFromPropertyExtractors(after._id!.toString(), [
      ...templatePropertyNames,
      'title',
    ]);
  });

  eventsBus.on(TemplateDeletedEvent, async ({ templateId }) => {
    await ixextractors.cleanupTemplateFromPropertyExtractors(templateId, []);
  });
};

export { registerEventListeners };
