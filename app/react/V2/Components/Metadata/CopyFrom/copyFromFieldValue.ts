import type { Entity } from '#V2/api/entities/types.js';
import type { DisplayContext } from '#V2/Components/Metadata/display/displayContext.js';
import { formatMetadataDisplayValue } from '#V2/Components/Metadata/display/index.js';
import {
  formatDateProperty,
  formatGeolocationProperty,
  formatLinkProperty,
  formatRelationshipProperty,
  formatSelectProperty,
  formatSimpleProperty,
} from '#V2/formatters/index.js';
import type {
  BaseMetadataProperty,
  GeolocationMetadataProperty,
  MetadataProperty,
} from '#V2/formatters/types.js';
import type { CopyFromMatchingProperty } from './copyFromMatchingProperties.js';

type CopyFromDisplayValue = {
  value?: unknown;
  label?: string;
  parent?: { value?: unknown; label?: string };
};

const toField = (property: CopyFromMatchingProperty): BaseMetadataProperty => ({
  _id: property.name,
  name: property.name,
  label: property.label,
  type: property.type,
});

const toMetadata = (
  property: CopyFromMatchingProperty,
  entries?: CopyFromDisplayValue[]
): NonNullable<Entity['metadata']> => ({
  [property.name]: (entries ?? []) as NonNullable<Entity['metadata']>[string],
});

const stubEntity = (
  property: CopyFromMatchingProperty,
  entries?: CopyFromDisplayValue[]
): Entity => ({
  _id: '',
  sharedId: '',
  language: 'en',
  title: '',
  template: '',
  creationDate: 0,
  user: '',
  metadata: toMetadata(property, entries),
  relations: [],
});

const normalizeLinkEntries = (entries?: CopyFromDisplayValue[]): CopyFromDisplayValue[] =>
  (entries ?? []).map(entry => {
    if (typeof entry.value !== 'string') {
      return entry;
    }
    return {
      value: { url: entry.value, ...(entry.label ? { label: entry.label } : {}) },
    };
  });

const normalizeGeoEntries = (entries?: CopyFromDisplayValue[]): CopyFromDisplayValue[] =>
  (entries ?? []).map(entry => {
    if (!entry.value || typeof entry.value !== 'object') {
      return entry;
    }
    const record = entry.value as Record<string, unknown>;
    const lat = record.lat ?? record.latitude;
    const lon = record.lon ?? record.lng ?? record.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return entry;
    }
    return { ...entry, value: { lat, lon } };
  });

const dropPropertyLabelFallback = (
  formatted: GeolocationMetadataProperty,
  fieldLabel: string
): GeolocationMetadataProperty => ({
  ...formatted,
  values: formatted.values.map(value =>
    value.label === fieldLabel ? { ...value, label: undefined } : value
  ),
});

const formatCopyFromScalarProperty = (
  field: BaseMetadataProperty,
  metadata: Entity['metadata']
): MetadataProperty | null | undefined => {
  switch (field.type) {
    case 'text':
    case 'generatedid':
    case 'numeric':
    case 'markdown':
      return formatSimpleProperty(field, metadata);
    case 'date':
    case 'multidate':
    case 'daterange':
    case 'multidaterange':
      return formatDateProperty(field, metadata);
    case 'select':
    case 'multiselect':
      return formatSelectProperty(field, metadata);
    default:
      return undefined;
  }
};

const formatCopyFromComplexProperty = (
  property: CopyFromMatchingProperty,
  entries?: CopyFromDisplayValue[]
): MetadataProperty | null => {
  const field = toField(property);
  if (property.type === 'link') {
    return formatLinkProperty(field, toMetadata(property, normalizeLinkEntries(entries)));
  }
  if (property.type === 'geolocation') {
    const formatted = formatGeolocationProperty(
      field,
      stubEntity(property, normalizeGeoEntries(entries)),
      []
    );
    return formatted ? dropPropertyLabelFallback(formatted, property.label) : null;
  }
  if (property.type === 'relationship' || property.type === 'newRelationship') {
    return formatRelationshipProperty(field, toMetadata(property, entries));
  }
  return null;
};

const toCopyFromMetadataProperty = (
  property: CopyFromMatchingProperty,
  entries?: CopyFromDisplayValue[]
): MetadataProperty | null => {
  const field = toField(property);
  const scalar = formatCopyFromScalarProperty(field, toMetadata(property, entries));
  if (scalar !== undefined) {
    return scalar;
  }
  return formatCopyFromComplexProperty(property, entries);
};

const formatCopyFromValue = (
  entries: CopyFromDisplayValue[] | undefined,
  property: CopyFromMatchingProperty,
  context: DisplayContext
): string => {
  const formatted = toCopyFromMetadataProperty(property, entries);
  return formatted ? formatMetadataDisplayValue(formatted, context) : '';
};

const copyFromValueKey = (entries?: CopyFromDisplayValue[]) =>
  JSON.stringify(
    (entries ?? []).map(entry => ({
      value: entry.value ?? null,
      label: entry.label ?? null,
      parent: entry.parent ?? null,
    }))
  );

const copyFromValuesAreEqual = (current?: CopyFromDisplayValue[], next?: CopyFromDisplayValue[]) =>
  copyFromValueKey(current) === copyFromValueKey(next);

export { copyFromValuesAreEqual, formatCopyFromValue };
export type { CopyFromDisplayValue };
