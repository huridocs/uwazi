import Ajv from 'ajv';
import { isUndefined, isNull } from 'util';
import { ensure } from 'shared/tsUtils';
import { propertyTypes } from 'shared/propertyTypes';
import entities from 'api/entities';
import thesauris from 'api/thesauri';
import { PropertySchema, MetadataObjectSchema } from 'shared/types/commonTypes';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';

import { validators, customErrorMessages } from './metadataValidators';

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

    const entityIds: string[] = (
      await entities.getUnrestrictedWithDocuments(
        {
          sharedId: { $in: valueIds },
          ...(property.content && { template: property.content }),
        },
        { sharedId: 1 }
      )
    ).map((v: EntityWithFilesSchema) => v.sharedId);

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

const validateSameRelationshipsMatch = (
  property: PropertySchema,
  entity: EntitySchema,
  template: TemplateSchema,
  value: MetadataObjectSchema[] | undefined
) => {
  let valid = true;
  if (value && property.type === propertyTypes.relationship) {
    const sameProps =
      template.properties?.filter(
        p =>
          p.type === propertyTypes.relationship &&
          p.content?.toString() === property.content?.toString() &&
          p.relationType?.toString() === property.relationType?.toString()
      ) || [];

    valid = Boolean(
      sameProps.every(
        p => !entity.metadata || JSON.stringify(entity.metadata[p.name]) === JSON.stringify(value)
      )
    );
  }

  return valid
    ? []
    : [
        validationError(
          { message: customErrorMessages.relationship_values_should_match },
          property,
          entity
        ),
      ];
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

export const validateMetadataField = async (
  property: PropertySchema,
  entity: EntitySchema,
  template: TemplateSchema
) => {
  const value = entity.metadata?.[ensure<string>(property.name)];

  const errors: Ajv.ErrorObject[] = [
    ...validateRequired(property, entity, value),
    ...validateType(property, entity, value),
    ...validateFieldSize(property, entity, value),
    ...validateSameRelationshipsMatch(property, entity, template, value),
    ...(await validateRelationshipForeignIds(property, entity, value)),
    ...(await validateDictionariesForeignIds(property, entity, value)),
  ];

  if (errors.length) {
    throw new Ajv.ValidationError(errors);
  }
};
