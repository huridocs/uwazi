import _ from 'lodash';

import entities from 'api/entities';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EventsBus } from 'api/eventsbus';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import settings from 'api/settings';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { shallowObjectDiff } from 'shared/data_utils/shallowObjectDiff';
import { ensure } from 'shared/tsUtils';
import { EntitySchema } from 'shared/types/entityType';
import { createDefaultSuggestionsForFiles } from './configurationManager';
import { Suggestions } from './suggestions';

const extractedMetadataChanged = async (existingEntity: EntitySchema, newEntity: EntitySchema) => {
  const extractionTemplates = (await settings.get({})).features?.metadataExtraction?.templates;
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

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(EntityUpdatedEvent, async ({ before, after, targetLanguageKey }) => {
    const originalDoc = before.find(doc => doc.language === targetLanguageKey)!;
    const modifiedDoc = after.find(doc => doc.language === targetLanguageKey)!;

    if (await extractedMetadataChanged(originalDoc, modifiedDoc)) {
      await Suggestions.updateStates({ entityId: originalDoc.sharedId });
    }
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

  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    await Suggestions.delete({ fileId: { $in: files.map(f => f._id) } });
  });
};

export { registerEventListeners };
