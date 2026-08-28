import type { Entity } from '#V2/api/entities/types.js';
import { toMetadataObjectSchema } from './EntityEditor/functions/toMetadataObjectSchema.js';
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

const stubEntity = (metadata: NonNullable<Entity['metadata']>): Entity => ({
  _id: '',
  sharedId: '',
  language: 'en',
  title: '',
  template: '',
  creationDate: 0,
  user: '',
  metadata,
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
  const entity = stubEntity(metadata);

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
