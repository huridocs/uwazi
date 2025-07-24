/* eslint-disable max-lines */
import { FullEntity } from 'api/templates/templateUpdateDenormalizeUseCase';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';

const denormalizeInheritedProperty = (
  property: PropertySchema,
  value: MetadataObjectSchema,
  partner: EntitySchema,
  allTemplates: TemplateSchema[]
) => {
  const partnerTemplate = allTemplates.find(
    t => t._id!.toString() === partner.template!.toString()
  );

  const inheritedProperty = partnerTemplate!.properties!.find(
    p => p._id && p._id.toString() === property!.inherit!.property!.toString()
  );

  return {
    ...value,
    inheritedValue: partner!.metadata?.[inheritedProperty!.name] || [],
    inheritedType: inheritedProperty!.type,
  };
};

const denormalizeRelationshipProperty = (
  property: PropertySchema,
  values: MetadataObjectSchema[],
  language: string,
  allTemplates: TemplateSchema[],
  relatedEntities: { [k: string]: EntitySchema } = {}
) => {
  return values.map(value => {
    let denormalizedValue = { ...value };

    const partner = relatedEntities[(denormalizedValue.value as string) + language];

    if (partner && partner.title) {
      denormalizedValue.label = partner.title;
      denormalizedValue.icon = partner.icon;
      denormalizedValue.type = partner.file ? 'document' : 'entity';
    }

    if (property.inherit && property.inherit.property && partner) {
      denormalizedValue = denormalizeInheritedProperty(
        property,
        denormalizedValue,
        partner,
        allTemplates
      );
    }

    return denormalizedValue;
  });
};

const validateValuesAreDenormalizable = (values: MetadataObjectSchema[] | undefined) => {
  if (!Array.isArray(values)) {
    throw new Error('denormalizeMetadata received non-array prop!');
  }

  if (values.some(value => !value.hasOwnProperty('value'))) {
    throw new Error('denormalizeMetadata received non-value prop!');
  }
};

const denormalizeProperty = (
  property: PropertySchema | undefined,
  values: MetadataObjectSchema[] | undefined,
  language: string,
  {
    allTemplates,
    relatedEntities,
  }: {
    allTemplates: TemplateSchema[];
    relatedEntities: { [k: string]: EntitySchema };
  }
) => {
  validateValuesAreDenormalizable(values);

  if (!property) {
    return values;
  }

  if (property.type === 'relationship') {
    return denormalizeRelationshipProperty(
      property,
      values!,
      language,
      allTemplates,
      relatedEntities
    );
  }

  return values;
};

function denormalizeMetadatatImproved(
  entity: FullEntity,
  template: TemplateSchema,
  preloadedData: {
    allTemplates: TemplateSchema[];
    relatedEntities: { [k: string]: EntitySchema };
  }
) {
  const result = Object.keys(entity.translations).reduce<FullEntity>(
    (denormalizedEntity: FullEntity, entityLanguage: string) => {
      Object.keys(entity.translations[entityLanguage].metadata || {}).forEach(
        (propertyName: string) => {
          if (
            denormalizedEntity.translations[entityLanguage].metadata &&
            entity.translations[entityLanguage].metadata
          ) {
            // eslint-disable-next-line no-param-reassign
            denormalizedEntity.translations[entityLanguage].metadata[propertyName] =
              denormalizeProperty(
                template.properties?.find(p => p.name === propertyName),
                entity.translations[entityLanguage].metadata[propertyName],
                entityLanguage,
                preloadedData
              );
          }
        }
      );
      return denormalizedEntity;
    },
    {
      sharedId: entity.sharedId,
      translations: entity.translations,
    }
  );
  return result;
}

export { denormalizeMetadatatImproved };
