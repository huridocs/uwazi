import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';

const prepareMetadata = (
  metadata: Entity['metadata'],
  template?: ClientTemplateSchema
): BaseMetadataProperty[] => {
  if (!metadata || !template?.properties) {
    return [];
  }

  const templateProperties: ClientTemplateSchema['properties'] = [...(template?.properties || [])];
  const propertiesByName = new Map(templateProperties.map(property => [property.name, property]));

  return Object.entries(metadata).flatMap(([name]) => {
    const property = propertiesByName.get(name);

    if (!property?._id) {
      return [];
    }

    const inheritedType = property.inherit?.type;

    return [
      {
        _id: property._id as string,
        name: property.name,
        label: property.label,
        type: property.type,
        inherited: Boolean(property.inherit),
        inheritedType,
      },
    ];
  });
};

export { prepareMetadata };
