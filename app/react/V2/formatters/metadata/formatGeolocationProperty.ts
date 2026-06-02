import { ClientTemplateSchema } from '#V2/shared/types.js';
import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty, GeolocationMetadataProperty } from '../types.js';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

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

type GroupedGeolocationProperty = {
  name: string;
  label: string;
  inherited?: boolean;
  content?: string;
};

const getCoordinatesFromMetadataValue = (metadataValue: GeolocationMetadataValue) => {
  if (!metadataValue.inheritedValue) {
    return [metadataValue?.value as Coordinate];
  }

  const inheritedRelationship = resolvePropertyMetadataValues(
    {
      _id: '__geolocation',
      name: '__geolocation',
      label: '__geolocation',
      type: 'relationship',
      inherited: true,
      inheritedType: 'geolocation',
    },
    {
      __geolocation: [metadataValue as unknown as { value?: unknown; inheritedValue?: unknown[] }],
    } as Entity['metadata']
  );

  return inheritedRelationship.map(item => item.value as Coordinate);
};

const getTemplateColor = (templateId: string | undefined, templates?: ClientTemplateSchema[]) =>
  templates?.find(template => template._id === templateId)?.color;

const getEntityTemplateColor = (
  propertyName: string,
  templates?: ClientTemplateSchema[],
  entityTemplateId?: string
) => {
  const colorByEntityTemplate = getTemplateColor(entityTemplateId, templates);

  if (typeof colorByEntityTemplate === 'string') {
    return colorByEntityTemplate;
  }

  return templates?.find(template =>
    (template.properties ?? []).some(templateProperty => templateProperty.name === propertyName)
  )?.color;
};

const formatGeolocationProperty = (
  property: BaseMetadataProperty,
  entity?: Entity,
  templates?: ClientTemplateSchema[]
): GeolocationMetadataProperty | null => {
  const type = resolvePropertyType(property, entity?.metadata);

  if (property.type !== 'geolocation' && type !== 'geolocation') {
    return null;
  }

  const entityTemplateId = entity?.template;

  const groupedProperties: GroupedGeolocationProperty[] = property.propertyGroup?.length
    ? property.propertyGroup
    : [
        {
          name: property.name,
          label: property.label,
          inherited: property.inherited,
          content: property.relationShipTarget,
        },
      ];

  const values = groupedProperties.flatMap(({ name, label, inherited, content }) =>
    (entity?.metadata?.[name] ?? []).flatMap(rawMetadataValue => {
      const metadataValue = rawMetadataValue as GeolocationMetadataValue;
      const templateColor = inherited
        ? getTemplateColor(content, templates)
        : getEntityTemplateColor(name, templates, entityTemplateId);

      const relatedEntity =
        metadataValue.type === 'entity' ? { _id: metadataValue.value as string } : undefined;
      const icon = metadataValue?.icon as { _id: string; label: string } | undefined;

      return getCoordinatesFromMetadataValue(metadataValue).flatMap(coordinate => {
        const latitude = coordinate?.lat;
        const longitude = coordinate?.lon;

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          return [];
        }

        return [
          {
            value: { latitude, longitude },
            label: metadataValue?.label || label,
            ...((typeof templateColor === 'string' || typeof metadataValue?.color === 'string') && {
              color: templateColor || metadataValue.color,
            }),
            ...(relatedEntity?._id && {
              entity: {
                _id: relatedEntity._id,
                ...(icon?._id && { icon: { _id: icon._id, label: icon.label } }),
              },
            }),
          },
        ];
      });
    })
  );

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'geolocation',
    ...(property.propertyGroup && { propertyGroup: property.propertyGroup }),
    values,
  };
};

export { formatGeolocationProperty };
