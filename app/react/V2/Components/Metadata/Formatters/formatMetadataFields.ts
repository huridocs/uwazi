import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';

const formatMetadataFields = (template?: ClientTemplateSchema): BaseMetadataProperty[] => {
  if (!template?.properties) {
    return [];
  }

  const templateProperties: ClientTemplateSchema['properties'] = [...(template?.properties || [])];

  return templateProperties.flatMap(property => {
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

export { formatMetadataFields };
