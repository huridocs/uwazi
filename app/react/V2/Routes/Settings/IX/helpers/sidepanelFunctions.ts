import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import { MetadataObjectSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import * as entitiesAPI from 'V2/api/entities';
import * as filesAPI from 'V2/api/files';
import { TemplateSchema } from 'shared/types/templateType';

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
      value = entityMetadata?.map((metadata: MetadataObjectSchema) => metadata.value) || [];
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

const handleEntitySave = async (
  entity?: ClientEntitySchema,
  property?: ClientPropertySchema,
  metadata?: PropertyValueSchema | PropertyValueSchema[] | undefined,
  template?: TemplateSchema,
  fieldHasChanged?: boolean
) => {
  const propertyName = property?.name;
  if (!fieldHasChanged || !entity || !propertyName) {
    return undefined;
  }

  let data;

  if (propertyName === 'title' && typeof metadata === 'string') {
    data = { title: metadata };
  } else {
    data = { properties: [{ [propertyName]: metadata }] };
  }

  if (property?.type === 'relationship') {
    template?.properties
      ?.filter(
        prop =>
          prop._id !== property._id &&
          prop.content === property.content &&
          prop.type === property.type
      )
      .forEach(prop => {
        data.properties?.push({ [prop.name]: metadata });
      });
  }

  const entityToSave = entitiesAPI.formatter.update(entity, data);

  return entitiesAPI.save(entityToSave);
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

const getPropertyNameFromExtractPair = (extractorPair: string) =>
  extractorPair.substring(extractorPair.indexOf('-') + 1, extractorPair.length);

const getTemplateFromExtractPair = (extractorPair: string) =>
  extractorPair.substring(0, extractorPair.indexOf('-'));

export {
  SELECT_TYPES,
  coerceValue,
  getFormValue,
  loadSidepanelData,
  handleEntitySave,
  getPropertyNameFromExtractPair,
  getTemplateFromExtractPair,
};
