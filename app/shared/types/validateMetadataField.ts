import Ajv from 'ajv';
import { isUndefined, isNull } from 'util';
import { ensure } from 'shared/tsUtils';
import { validators, customErrorMessages } from 'api/entities/metadataValidators.js';
import { propertyTypes } from 'shared/propertyTypes';
import entities from 'api/entities';
import thesauris from 'api/thesauri';

import { EntitySchema } from './entityType';
import { PropertySchema, MetadataObjectSchema } from './commonTypes';
import { ThesaurusSchema, ThesaurusValueSchema } from './thesaurusType';

const hasValue = (value: any) => !isUndefined(value) && !isNull(value);

const validationError = (
  error: Partial<Ajv.ErrorObject>,
  property: PropertySchema,
  entity: EntitySchema
) => ({
  keyword: 'metadataMatchesTemplateProperties',
  schemaPath: '',
  params: {
    keyword: 'metadataMatchesTemplateProperties',
    data: entity[ensure<string>(property.name)],
  },
  dataPath: `.metadata['${property.name}']`,
  ...error,
});

const validateRequired = (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
): Ajv.ErrorObject[] => {
  if (!validators.validateRequiredProperty(property, value)) {
    return [validationError({ message: customErrorMessages.required }, property, entity)];
  }
  return [];
};

const validateType = (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  //@ts-ignore
  if (hasValue(value) && validators[property.type] && !validators[property.type](value)) {
    //@ts-ignore
    return [validationError({ message: customErrorMessages[property.type] }, property, entity)];
  }
  return [];
};

const flattenDictionaryValues = (dictionary: ThesaurusSchema) =>
  (dictionary.values || []).reduce<ThesaurusValueSchema[]>((flattened, v) => {
    if (v.values?.length) {
      return flattened.concat(v.values);
    }
    return flattened.concat([v]);
  }, []);

const validateDictionariesForeignIds = async (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  const usesDictionary =
    property.type === propertyTypes.select || property.type === propertyTypes.multiselect;

  if (value && usesDictionary) {
    const dictionaryValues = flattenDictionaryValues(
      ensure<ThesaurusSchema>(await thesauris.getById(property.content))
    ).map(v => v.id);

    const diff = value
      .filter(v => v.value)
      .filter(v => !dictionaryValues.includes(String(v.value)));

    if (diff.length) {
      return [
        validationError(
          { message: customErrorMessages.dictionary_wrong_foreing_id, data: diff },
          property,
          entity
        ),
      ];
    }
  }
  return [];
};

const validateRelationshipForeignIds = async (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  if (value && property.type === propertyTypes.relationship) {
    const valueIds = value.map(v => v.value);

    const entityIds = (
      await entities.getUnrestrictedWithDocuments(
        {
          sharedId: { $in: valueIds },
          ...(property.content && { template: property.content }),
        },
        { sharedId: 1 }
      )
    ).map(v => v.sharedId);

    const diff = value.filter(v => !entityIds.includes(String(v.value)));

    if (diff.length) {
      return [
        validationError(
          { message: customErrorMessages.relationship_wrong_foreign_id, data: diff },
          property,
          entity
        ),
      ];
    }
  }
  return [];
};

const validateFieldSize = (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  if (hasValue(value) && !validators.validateLuceneBytesLimit(value)) {
    return [validationError({ message: customErrorMessages.length_exceeded }, property, entity)];
  }
  return [];
};

export const validateMetadataField = async (property: PropertySchema, entity: EntitySchema) => {
  const value = entity.metadata?.[ensure<string>(property.name)];

  const errors: Ajv.ErrorObject[] = [
    ...validateRequired(property, entity, value),
    ...validateType(property, entity, value),
    ...validateFieldSize(property, entity, value),
    ...(await validateRelationshipForeignIds(property, entity, value)),
    ...(await validateDictionariesForeignIds(property, entity, value)),
  ];

  if (errors.length) {
    throw new Ajv.ValidationError(errors);
  }
};
