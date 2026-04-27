import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, GeolocationMetadataProperty } from '../MetadataPropertiesType.js';

const formatGeolocationProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): GeolocationMetadataProperty | null => {
  if (property.type !== 'geolocation') {
    return null;
  }

  const groupedProperties = property.propertyGroup?.length
    ? property.propertyGroup
    : [{ name: property.name, label: property.label }];

  const values = groupedProperties.flatMap(({ name, label }) =>
    (metadata?.[name] ?? []).flatMap(metadataValue => {
      const coordinate = metadataValue?.value as {
        lat?: number;
        lon?: number;
      };

      const latitude = coordinate?.lat;
      const longitude = coordinate?.lon;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return [];
      }

      return [
        {
          value: { latitude, longitude },
          label: metadataValue?.label || label,
          ...(typeof metadataValue?.color === 'string' && { color: metadataValue.color }),
        },
      ];
    })
  );

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'geolocation',
    values,
  };
};

export { formatGeolocationProperty };
