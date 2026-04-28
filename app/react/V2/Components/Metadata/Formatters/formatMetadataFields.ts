import { PropertySchema } from '#shared/types/commonTypes.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';

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
        hideLabel: property.noLabel,
      };

      if (options?.groupGeolocationProperties && isGeolocationProperty) {
        const propertyGroup = [{ name: property.name, label: property.label }];

        for (let nextIndex = index + 1; nextIndex < templateProperties.length; nextIndex += 1) {
          const adjacentProperty = templateProperties[nextIndex] as PropertySchema;
          const adjacentGeolocationProperty =
            adjacentProperty?.type === 'geolocation' ||
            adjacentProperty?.inherit?.type === 'geolocation';

          if (!adjacentGeolocationProperty) {
            break;
          }

          propertyGroup.push({
            name: adjacentProperty.name,
            label: adjacentProperty.label,
            ...(adjacentProperty.inherit?.type === 'geolocation' && {
              inherited: true,
              content: adjacentProperty.content,
              property: adjacentProperty.inherit.property,
            }),
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
