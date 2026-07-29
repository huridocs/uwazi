import { PropertySchema } from '#shared/types/commonTypes.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../types.js';

const formatMetadataFields = (
  template?: ClientTemplateSchema,
  options?: { groupGeolocationProperties?: boolean }
): BaseMetadataProperty[] => {
  if (!template?.properties) {
    return [];
  }

  const templateProperties: ClientTemplateSchema['properties'] = [...(template?.properties || [])];
  const formattedProperties: BaseMetadataProperty[] = [];
  let groupedGeolocationIndex = 1;

  const formatGeolocationGroupEntry = (property: PropertySchema) => ({
    ...(typeof property._id === 'string' ? { _id: property._id } : {}),
    name: property.name,
    label: property.label,
    ...(property.inherit?.type === 'geolocation' && {
      inherited: true,
      content: property.content,
      property: property.inherit.property,
    }),
  });

  for (let index = 0; index < templateProperties.length; index += 1) {
    const property = templateProperties[index] as PropertySchema;

    const isGeolocationProperty =
      property.type === 'geolocation' || property.inherit?.type === 'geolocation';

    if (property?._id) {
      const formattedProperty: BaseMetadataProperty = {
        _id: property._id as string,
        name: property.name,
        label: property.label,
        type: property.type,
        inherited: Boolean(property.inherit),
        inheritedType: property.inherit?.type,
        ...(property.type === 'relationship' && {
          relationShipTarget: property.content || '',
        }),
        ...(property.type === 'newRelationship' &&
          property.denormalizedProperty && {
            denormalizedProperty: property.denormalizedProperty,
          }),
        hideLabel: property.noLabel,
      };

      if (options?.groupGeolocationProperties && isGeolocationProperty) {
        const propertyGroup = [formatGeolocationGroupEntry(property)];

        for (let nextIndex = index + 1; nextIndex < templateProperties.length; nextIndex += 1) {
          const adjacentProperty = templateProperties[nextIndex] as PropertySchema;
          const adjacentGeolocationProperty =
            adjacentProperty?.type === 'geolocation' ||
            adjacentProperty?.inherit?.type === 'geolocation';

          if (!adjacentGeolocationProperty) {
            break;
          }

          propertyGroup.push({
            ...formatGeolocationGroupEntry(adjacentProperty),
          });
          index = nextIndex;
        }

        if (propertyGroup.length > 1) {
          const groupId = `group${groupedGeolocationIndex}`;

          formattedProperties.push({
            _id: groupId,
            name: `__${groupId}`,
            label: `__${groupId}`,
            type: 'geolocation',
            propertyGroup,
            inherited: false,
            inheritedType: undefined,
          });

          groupedGeolocationIndex += 1;
        } else {
          formattedProperties.push(formattedProperty);
        }
      } else {
        formattedProperties.push(formattedProperty);
      }
    }
  }

  return formattedProperties;
};

export { formatMetadataFields };
