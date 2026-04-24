import { Entity } from '#V2/api/entities/types.js';
import {
  BaseMetadataProperty,
  DateMetadataProperty,
  DateRangeMetadataProperty,
  MultiDateMetadataProperty,
  MultiDateRangeMetadataProperty,
} from '../MetadataPropertiesType.js';

const isDateType = (type: BaseMetadataProperty['type']) =>
  type === 'date' || type === 'multidate' || type === 'daterange' || type === 'multidaterange';

const formatSingleDateValues = (metadataValues: NonNullable<Entity['metadata']>[string] = []) =>
  metadataValues.flatMap(item => (typeof item?.value === 'number' ? [{ value: item.value }] : []));

const formatRangeDateValues = (metadataValues: NonNullable<Entity['metadata']>[string] = []) =>
  metadataValues.flatMap(item => {
    const range = item?.value;

    if (!range || typeof range !== 'object') {
      return [];
    }

    const from = 'from' in range && typeof range.from === 'number' ? range.from : 0;
    const to = 'to' in range && typeof range.to === 'number' ? range.to : 0;

    if (!from && !to) {
      return [];
    }

    return [{ value: { from, to } }];
  });

const createSingleDateProperty = (
  property: BaseMetadataProperty,
  values: DateMetadataProperty['values']
): DateMetadataProperty | MultiDateMetadataProperty => {
  if (property.type === 'date') {
    return {
      _id: property._id,
      name: property.name,
      label: property.label,
      type: 'date',
      values,
      inherited: property.inherited,
      inheritedType: property.inheritedType,
    };
  }

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'multidate',
    values,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

const createRangeDateProperty = (
  property: BaseMetadataProperty,
  values: DateRangeMetadataProperty['values']
): DateRangeMetadataProperty | MultiDateRangeMetadataProperty => {
  if (property.type === 'daterange') {
    return {
      _id: property._id,
      name: property.name,
      label: property.label,
      type: 'daterange',
      values,
      inherited: property.inherited,
      inheritedType: property.inheritedType,
    };
  }

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'multidaterange',
    values,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

const formatDateProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
):
  | DateMetadataProperty
  | MultiDateMetadataProperty
  | DateRangeMetadataProperty
  | MultiDateRangeMetadataProperty
  | null => {
  if (!isDateType(property.type)) {
    return null;
  }

  const metadataValues = metadata?.[property.name] ?? [];

  if (property.type === 'date' || property.type === 'multidate') {
    return createSingleDateProperty(property, formatSingleDateValues(metadataValues));
  }

  return createRangeDateProperty(property, formatRangeDateValues(metadataValues));
};

export { formatDateProperty };
