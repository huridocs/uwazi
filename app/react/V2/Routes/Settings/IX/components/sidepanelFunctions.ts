import { ClientEntitySchema } from 'app/istore';
import {
  ExtractedMetadataSchema,
  MetadataObjectSchema,
  PropertyValueSchema,
} from 'shared/types/commonTypes';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FileType } from 'shared/types/fileType';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import * as entitiesAPI from 'V2/api/entities';
import * as filesAPI from 'V2/api/files';

const SELECT_TYPES = ['select', 'multiselect', 'relationship'];

// eslint-disable-next-line max-statements
const getFormValue = (
  suggestion?: EntitySuggestionType,
  entity?: ClientEntitySchema,
  type?: string
) => {
  let value;

  if (!suggestion || !entity) {
    return value;
  }

  if (suggestion.propertyName === 'title' && entity.title) {
    value = entity.title;
  }

  if (suggestion.propertyName !== 'title' && entity.metadata) {
    const entityMetadata = entity.metadata[suggestion.propertyName];
    value = entityMetadata?.length ? entityMetadata[0].value : '';

    if (type === 'date' && value) {
      const dateString = secondsToISODate(value as number);
      value = dateString;
    }

    if (type === 'select' || type === 'multiselect' || type === 'relationship') {
      value = entityMetadata?.map((metadata: MetadataObjectSchema) => metadata.value);
    }
  }

  return value;
};

const loadSidepanelData = async ({
  fileId,
  entityId,
  language = 'en',
}: {
  fileId?: string;
  entityId: string;
  language: string;
}) => {
  const [file, entity] = await Promise.all([
    (fileId && filesAPI.getById(fileId)) || [],
    entitiesAPI.getById({ _id: entityId, language }),
  ]);

  return { ...(file[0] && { file: file[0] }), entity: entity[0] };
};

const loadValuesAndSuggestions = async (
  value: string[],
  suggestions: string[],
  language: string
) => {
  const entities = await Promise.all(
    value.map(async sharedId => {
      const [entity] = await entitiesAPI.getBySharedId({ sharedId, language });
      return entity;
    })
  );

  const suggestionsEntities = await Promise.all(
    suggestions.map(async sharedId => {
      const [entity] = await entitiesAPI.getBySharedId({ sharedId, language });
      return entity;
    })
  );

  return [...entities, ...suggestionsEntities].filter(entity => entity);
};

const handleEntitySave = async (
  entity?: ClientEntitySchema,
  propertyName?: string,
  metadata?: PropertyValueSchema | PropertyValueSchema[] | undefined,
  fieldHasChanged?: boolean
) => {
  if (!fieldHasChanged || !entity || !propertyName) {
    return undefined;
  }

  let data;

  if (propertyName === 'title' && typeof metadata === 'string') {
    data = { title: metadata };
  } else {
    data = { properties: [{ [propertyName]: metadata }] };
  }

  const entityToSave = entitiesAPI.formatter.update(entity, data);

  return entitiesAPI.save(entityToSave);
};

const handleFileSave = async (file?: FileType, newSelections?: ExtractedMetadataSchema[]) => {
  if (file && newSelections) {
    const fileToSave = { ...file };
    fileToSave.extractedMetadata = newSelections;
    return filesAPI.update(fileToSave);
  }

  return undefined;
};

const coerceValue = async (
  propertyType: 'date' | 'numeric',
  text: string | Date | undefined,
  language: string = 'en'
) => {
  if (propertyType === 'date' && !Number.isNaN(text?.valueOf())) {
    return entitiesAPI.coerceValue(text!, 'date', language);
  }

  if (propertyType === 'numeric' && typeof text === 'string') {
    return entitiesAPI.coerceValue(text.trim(), 'numeric', language);
  }

  return undefined;
};

export {
  SELECT_TYPES,
  coerceValue,
  getFormValue,
  loadSidepanelData,
  loadValuesAndSuggestions,
  handleEntitySave,
  handleFileSave,
};
