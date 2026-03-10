import { ObjectId } from 'mongodb';
import Ajv, { ErrorObject } from 'ajv';
import { isUndefined, isNull } from 'util';
import { ensure } from 'shared/tsUtils';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema, MetadataObjectSchema } from 'shared/types/commonTypes';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { arrayBidirectionalDiff } from 'shared/data_utils/arrayBidirectionalDiff';
import entities from 'api/entities';
import thesauris from 'api/thesauri';
import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { validators, customErrorMessages } from './metadataValidators';

const hasValue = (value: any) => !isUndefined(value) && !isNull(value);

const validationError = (
  error: Partial<ErrorObject>,
  property: PropertySchema,
  entity: EntitySchema
) => ({
  keyword: 'metadataMatchesTemplateProperties',
  schemaPath: '',
  params: {
    keyword: 'metadataMatchesTemplateProperties',
    data: entity[ensure<string>(property.name)],
  },
  instancePath: `.metadata['${property.name}']`,
  ...error,
});

const validateRequired = (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
): ErrorObject[] => {
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

const compareThesaurusValue = async (property: PropertySchema, value: MetadataObjectSchema[]) => {
  const thesaurus = await thesauris.getById(property.content);
  const thesaurusValues = flatThesaurusValues(thesaurus).map(v => v.id);

  return value.filter(v => v.value && !thesaurusValues.includes(String(v.value)));
};

const validateDictionariesForeignIds = async (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  const usesDictionary =
    property.type === propertyTypes.select || property.type === propertyTypes.multiselect;

  if (value && usesDictionary) {
    const diff = await compareThesaurusValue(property, value);
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

const validateRelationshipV2 = async (
  property: PropertySchema,
  entity: EntitySchema,
  value: MetadataObjectSchema[] = []
) => {
  if (value && property.type === propertyTypes.newRelationship) {
    const valueIds = value.map(v => v.value as string);
    const { targetTemplates } = property;

    if (!targetTemplates) {
      const currentEntity = await entities.getById(entity.sharedId, entity.language);
      const diff = arrayBidirectionalDiff(
        currentEntity?.metadata?.[property.name] || [],
        value,
        v => v.value as string,
        v => v
      );

      if (diff.added.length || diff.removed.length) {
        return [
          validationError(
            {
              message: customErrorMessages.read_only,
              data: [...diff.added, ...diff.removed],
            },
            property,
            entity
          ),
        ];
      }

      return [];
    }

    const entitiesInValues: EntityWithFilesSchema[] = await entities.getUnrestricted(
      {
        sharedId: { $in: valueIds },
        template: { $in: targetTemplates.map(t => new ObjectId(t)) },
      },
      { sharedId: 1, template: 1 }
    );

    const validIds = new Set(entitiesInValues.map(e => e.sharedId!));

    if (validIds.size !== valueIds.length) {
      const invalidIds = valueIds.flatMap(v => (validIds.has(v) ? [] : [{ value: v }]));

      return [
        validationError(
          {
            message: customErrorMessages.relationship_wrong_foreign_id,
            data: invalidIds,
          },
          property,
          entity
        ),
      ];
    }

    return [];
  }

  return [];
};

const validateSameRelationshipsMatch = (
  property: PropertySchema,
  entity: EntitySchema,
  template: TemplateSchema,
  value: MetadataObjectSchema[] = []
) => {
  if (property.type !== propertyTypes.relationship) {
    return [];
  }

  const sameProps =
    template.properties?.filter(
      p =>
        p.type === propertyTypes.relationship &&
        p.content?.toString() === property.content?.toString() &&
        p.relationType?.toString() === property.relationType?.toString()
    ) || [];

  const valid = sameProps.every(p => {
    const otherProp = entity.metadata?.[p.name] || [];
    return (
      otherProp?.length === value?.length &&
      value.every(mo => otherProp?.find(_mo => _mo.value === mo.value))
    );
  });

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

export const validateMetadataField = async (
  property: PropertySchema,
  entity: EntitySchema,
  template: TemplateSchema
) => {
  const value = entity.metadata?.[ensure<string>(property.name)];

  const errors: ErrorObject[] = [
    ...validateRequired(property, entity, value),
    ...validateType(property, entity, value),
    ...validateSameRelationshipsMatch(property, entity, template, value),
    ...(await validateRelationshipForeignIds(property, entity, value)),
    ...(await validateDictionariesForeignIds(property, entity, value)),
    ...(await validateRelationshipV2(property, entity, value)),
  ];

  if (errors.length) {
    throw new Ajv.ValidationError(errors);
  }
};
