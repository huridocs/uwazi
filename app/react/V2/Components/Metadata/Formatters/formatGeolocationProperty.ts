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
      let coordinate = metadataValue?.value as {
        lat?: number;
        lon?: number;
      };

      if (metadataValue.inheritedValue) {
        coordinate = metadataValue.inheritedValue[0]?.value as { lat?: number; lon?: number };
      }

      const latitude = coordinate?.lat;
      const longitude = coordinate?.lon;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return [];
      }

      const entity =
        metadataValue.type === 'entity' ? { _id: metadataValue.value as string } : undefined;
      const icon = metadataValue?.icon as { _id: string; label: string } | undefined;

      return [
        {
          value: { latitude, longitude },
          label: metadataValue?.label || label,
          ...(typeof metadataValue?.color === 'string' && { color: metadataValue.color }),
          ...(entity?._id && {
            entity: {
              _id: entity._id,
              ...(icon?._id && { icon: { _id: icon._id, label: icon.label } }),
            },
          }),
        },
      ];
    })
  );

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'geolocation',
    propertyGroup: property.propertyGroup,
    values,
  };
};

export { formatGeolocationProperty };
