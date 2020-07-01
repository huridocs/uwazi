import Ajv from 'ajv';
import { isUndefined, isNull } from 'util';
import { ensure } from 'shared/tsUtils';
import { validators, customErrorMessages } from 'api/entities/metadataValidators.js';
import { propertyTypes } from 'shared/propertyTypes';
import entities from 'api/entities';

import { EntitySchema } from './entityType';
import { PropertySchema, MetadataObjectSchema } from './commonTypes';

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

const validateForeignIds = async (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  if (value && property.type === propertyTypes.relationship) {
    const valueIds = value.map(v => v.value);

    const entityIds = (
      await entities.get(
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
    ...(await validateForeignIds(property, entity, value)),
  ];

  if (errors.length) {
    throw new Ajv.ValidationError(errors);
  }
};
