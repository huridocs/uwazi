import type { PropertyValueSchema } from '#shared/types/commonTypes.js';
import type { Entity, MetadataObjectSchema } from '#V2/api/entities/types.js';
import {
  formatDateProperty,
  formatGeolocationProperty,
  formatImageProperty,
  formatLinkProperty,
  formatMediaProperty,
  formatSelectProperty,
  formatSimpleProperty,
} from '#V2/formatters/index.js';
import type {
  BaseMetadataProperty,
  MetadataProperty,
  MetadataValue,
} from '#V2/formatters/types.js';

const INHERITED = 'inherited';

const isLatLon = (value: object): value is { lat: number; lon: number } =>
  'lat' in value &&
  'lon' in value &&
  typeof value.lat === 'number' &&
  typeof value.lon === 'number';

const isPropertyValueSchema = (value: unknown): value is PropertyValueSchema => {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(item => typeof item === 'object' && item !== null && isLatLon(item));
  }
  if (typeof value !== 'object') return false;
  if ('url' in value && typeof value.url === 'string') return true;
  if ('from' in value || 'to' in value) return true;
  return isLatLon(value);
};

const toMetadataObjectSchema = (value: MetadataValue): MetadataObjectSchema => {
  const entry: MetadataObjectSchema = {
    value: isPropertyValueSchema(value.value) ? value.value : null,
  };
  if (typeof value.label === 'string') entry.label = value.label;
  if (typeof value.type === 'string') entry.type = value.type;
  if (value.parent && typeof value.parent.label === 'string') {
    entry.parent = {
      label: value.parent.label,
      value: String(value.parent.value ?? ''),
    };
  }
  return entry;
};

const inheritedField = (
  type: NonNullable<MetadataValue['inheritedType']>
): BaseMetadataProperty => ({
  _id: INHERITED,
  name: INHERITED,
  label: '',
  type,
  inheritedType: type,
  ...(type === 'image' ? { style: 'contain' as const } : {}),
});

const inheritedMetadata = (values: MetadataValue[]): NonNullable<Entity['metadata']> => ({
  [INHERITED]: values.map(toMetadataObjectSchema),
});

const stubEntity = (values: MetadataValue[]): Entity => ({
  _id: '',
  sharedId: '',
  language: 'en',
  title: '',
  template: '',
  creationDate: 0,
  user: '',
  metadata: inheritedMetadata(values),
  relations: [],
});

const formatInheritedCellProperty = (
  inheritedType: NonNullable<MetadataValue['inheritedType']>,
  values: MetadataValue[]
): MetadataProperty | null => {
  if (inheritedType === 'relationship') {
    return null;
  }

  const field = inheritedField(inheritedType);
  const metadata = inheritedMetadata(values);
  const entity = stubEntity(values);

  switch (inheritedType) {
    case 'text':
    case 'generatedid':
    case 'numeric':
    case 'markdown':
      return formatSimpleProperty(field, metadata);
    case 'date':
    case 'daterange':
    case 'multidate':
    case 'multidaterange':
      return formatDateProperty(field, metadata);
    case 'geolocation':
      return formatGeolocationProperty(field, entity, []);
    case 'link':
      return formatLinkProperty(field, metadata);
    case 'media':
      return formatMediaProperty(field, metadata);
    case 'image':
    case 'preview':
      return formatImageProperty(field, metadata, undefined, entity);
    case 'select':
    case 'multiselect':
      return formatSelectProperty(field, metadata);
    default:
      return null;
  }
};

export { formatInheritedCellProperty };
