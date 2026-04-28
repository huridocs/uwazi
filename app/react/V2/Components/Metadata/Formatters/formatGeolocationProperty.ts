import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, GeolocationMetadataProperty } from '../MetadataPropertiesType.js';
import { resolveInheritedRelationship } from './formatRelationshipProperty.js';

type Coordinate = {
  lat?: number;
  lon?: number;
};

type GeolocationMetadataValue = {
  value?: unknown;
  inheritedValue?: GeolocationMetadataValue[];
  inheritedType?: string;
  type?: string;
  label?: string;
  color?: string;
  icon?: unknown;
};

const getCoordinateFromMetadataValue = (metadataValue: GeolocationMetadataValue) => {
  if (!metadataValue.inheritedValue) {
    return metadataValue?.value as Coordinate;
  }

  const inheritedRelationship = resolveInheritedRelationship(
    [metadataValue as unknown as Parameters<typeof resolveInheritedRelationship>[0][number]],
    'geolocation'
  );

  const inheritedCoordinate =
    inheritedRelationship.values.find(
      item =>
        item?.value &&
        typeof (item.value as Coordinate)?.lat === 'number' &&
        typeof (item.value as Coordinate)?.lon === 'number'
    )?.value || inheritedRelationship.values[0]?.value;

  return inheritedCoordinate as Coordinate;
};

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
    (metadata?.[name] ?? []).flatMap(rawMetadataValue => {
      const metadataValue = rawMetadataValue as GeolocationMetadataValue;
      const coordinate = getCoordinateFromMetadataValue(metadataValue);

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
