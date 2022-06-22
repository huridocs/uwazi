import _ from 'lodash';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EventsBus } from 'api/eventsbus';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import settings from 'api/settings';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { shallowObjectDiff } from 'shared/data_utils/shallowObjectDiff';
import { EntitySchema } from 'shared/types/entityType';
import { Suggestions } from './suggestions';

const updateIxSuggestionsTrigger = async (
  existingEntity: EntitySchema,
  newEntity: EntitySchema
) => {
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
  return changedMetadata.some(m => extractedProperties.has(m));
};

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(EntityUpdatedEvent, async ({ before, after, targetLanguageKey }) => {
    const originalDoc = before.find(doc => doc.language === targetLanguageKey)!;
    const modifiedDoc = after.find(doc => doc.language === targetLanguageKey)!;
    if (await updateIxSuggestionsTrigger(originalDoc, modifiedDoc)) {
      await Suggestions.updateStates({ entityId: originalDoc.sharedId });
    }
  });

  eventsBus.on(FileUpdatedEvent, async ({ before, after }) => {
    if (!_.isEqual(before.extractedMetadata, after.extractedMetadata)) {
      await Suggestions.updateStates({ fileId: after._id });
    }
  });
};

export { registerEventListeners };
