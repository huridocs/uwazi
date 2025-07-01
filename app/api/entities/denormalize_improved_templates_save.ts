/* eslint-disable max-lines */
import {
  LanguageISO6391,
  MetadataObjectSchema,
  MetadataSchema,
  PropertySchema,
} from 'shared/types/commonTypes';
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

const denormalizeRelationshipProperty = async (
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

const denormalizeProperty = async (
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

async function denormalizeMetadatatImproved(
  metadata: MetadataSchema | undefined,
  language: LanguageISO6391,
  template: TemplateSchema,
  preloadedData: {
    allTemplates: TemplateSchema[];
    relatedEntities: { [k: string]: EntitySchema };
  }
) {
  if (!metadata || !template) {
    return metadata;
  }

  const denormalizedProperties: {
    propertyName: string;
    denormalizedValue: MetadataObjectSchema[] | undefined;
  }[] = await Promise.all(
    Object.keys(metadata).map(async propertyName => ({
      propertyName,
      denormalizedValue: await denormalizeProperty(
        template.properties?.find(p => p.name === propertyName),
        metadata[propertyName],
        language,
        preloadedData
      ),
    }))
  );

  const denormalizedMetadata: Record<string, MetadataObjectSchema[] | undefined> = {};
  denormalizedProperties.forEach(({ propertyName, denormalizedValue }) => {
    denormalizedMetadata[propertyName] = denormalizedValue;
  });

  return denormalizedMetadata;
}

export { denormalizeMetadatatImproved };
