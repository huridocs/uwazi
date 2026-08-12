import { type ReactNode } from 'react';
import type {
  DateMetadataProperty,
  DateRangeMetadataProperty,
  GeolocationMetadataProperty,
  ImageMetadataProperty,
  LinkMetadataProperty,
  MediaMetadataProperty,
  MetadataProperty,
  MetadataValue,
  MultiDateMetadataProperty,
  MultiDateRangeMetadataProperty,
  MultiSelectMetadataProperty,
  SelectMetadataProperty,
  SimpleMetadataProperty,
} from '#V2/formatters/types.js';
import { resolveInheritedRelationship } from '#V2/formatters/metadata/resolvePropertyMetadataValues.js';
import { renderFieldContent } from './metadataFieldContent.js';

type InheritedSourceRows = {
  value?: unknown;
  inheritedType?: MetadataValue['inheritedType'];
  inheritedValue?: MetadataValue[];
}[];

const base = { _id: 'inherited', name: 'inherited', label: '' };

const isLatLon = (value: unknown): value is { lat: number; lon: number; label?: string } => {
  if (!value || typeof value !== 'object') return false;
  if (!('lat' in value) || !('lon' in value)) return false;
  return typeof value.lat === 'number' && typeof value.lon === 'number';
};

const stringValues = (items: MetadataValue[]): Array<{ value: string }> =>
  items.flatMap(item => {
    if (typeof item.value === 'string' && item.value.length > 0) return [{ value: item.value }];
    if (typeof item.value === 'number') return [{ value: String(item.value) }];
    return [];
  });

const labelFallback = (items: MetadataValue[]): string | undefined => {
  const parts = items
    .map(item => {
      if (typeof item.label === 'string' && item.label.length > 0) return item.label;
      if (typeof item.value === 'string') return item.value;
      if (typeof item.value === 'number') return String(item.value);
      return undefined;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(', ') : undefined;
};

const toInheritedField = (
  inheritedType: NonNullable<MetadataValue['inheritedType']>,
  inheritedValue: MetadataValue[]
): MetadataProperty | null => {
  switch (inheritedType) {
    case 'geolocation': {
      const values: GeolocationMetadataProperty['values'] = inheritedValue.flatMap(item => {
        if (!isLatLon(item.value)) return [];
        const label =
          (typeof item.label === 'string' && item.label) ||
          (typeof item.value.label === 'string' ? item.value.label : undefined);
        return [
          {
            value: { latitude: item.value.lat, longitude: item.value.lon },
            ...(label ? { label } : {}),
          },
        ];
      });
      if (!values.length) return null;
      const field: GeolocationMetadataProperty = { ...base, type: 'geolocation', values };
      return field;
    }
    case 'markdown':
    case 'text':
    case 'generatedid':
    case 'numeric': {
      const values = stringValues(inheritedValue);
      if (!values.length) return null;
      const field: SimpleMetadataProperty = { ...base, type: inheritedType, values };
      return field;
    }
    case 'media': {
      const values = stringValues(inheritedValue);
      if (!values.length) return null;
      const field: MediaMetadataProperty = { ...base, type: 'media', values };
      return field;
    }
    case 'image': {
      const values = stringValues(inheritedValue);
      if (!values.length) return null;
      const field: ImageMetadataProperty = {
        ...base,
        type: 'image',
        style: 'contain',
        values,
      };
      return field;
    }
    case 'date':
    case 'multidate': {
      const values = inheritedValue.flatMap(item =>
        typeof item.value === 'number' ? [{ value: item.value }] : []
      );
      if (!values.length) return null;
      if (inheritedType === 'date') {
        const field: DateMetadataProperty = { ...base, type: 'date', values };
        return field;
      }
      const field: MultiDateMetadataProperty = { ...base, type: 'multidate', values };
      return field;
    }
    case 'daterange':
    case 'multidaterange': {
      const values = inheritedValue.flatMap(item => {
        const range = item.value;
        if (!range || typeof range !== 'object') return [];
        const from = 'from' in range && typeof range.from === 'number' ? range.from : 0;
        const to = 'to' in range && typeof range.to === 'number' ? range.to : 0;
        if (!from && !to) return [];
        return [{ value: { from, to } }];
      });
      if (!values.length) return null;
      if (inheritedType === 'daterange') {
        const field: DateRangeMetadataProperty = { ...base, type: 'daterange', values };
        return field;
      }
      const field: MultiDateRangeMetadataProperty = { ...base, type: 'multidaterange', values };
      return field;
    }
    case 'select':
    case 'multiselect': {
      const values = inheritedValue.map(item => ({
        value: typeof item.value === 'string' ? item.value : String(item.value ?? ''),
        label: item.label || '',
        ...(item.parent
          ? {
              parent: {
                value: String(item.parent.value ?? ''),
                label: item.parent.label || '',
              },
            }
          : {}),
      }));
      if (!values.length) return null;
      if (inheritedType === 'select') {
        const field: SelectMetadataProperty = { ...base, type: 'select', values };
        return field;
      }
      const field: MultiSelectMetadataProperty = { ...base, type: 'multiselect', values };
      return field;
    }
    case 'link': {
      const values = inheritedValue.flatMap(item => {
        const link = item.value;
        if (!link || typeof link !== 'object') return [];
        const url = 'url' in link && typeof link.url === 'string' ? link.url : '';
        if (!url) return [];
        const linkLabel =
          ('label' in link && typeof link.label === 'string' && link.label) ||
          (typeof item.label === 'string' ? item.label : undefined);
        return [{ value: url, ...(linkLabel ? { label: linkLabel } : {}) }];
      });
      if (!values.length) return null;
      const field: LinkMetadataProperty = { ...base, type: 'link', values };
      return field;
    }
    default:
      return null;
  }
};

const inheritedCellContent = (
  values: InheritedSourceRows | undefined,
  entityId: string
): ReactNode => {
  const row = values?.find(value => String(value.value ?? '') === entityId);
  if (!row?.inheritedValue?.length) return undefined;

  const flattened = resolveInheritedRelationship(row.inheritedValue, row.inheritedType);
  if (!flattened.values.length) return undefined;

  if (flattened.inheritedType && flattened.inheritedType !== 'relationship') {
    const field = toInheritedField(flattened.inheritedType, flattened.values);
    const content = field ? renderFieldContent(field) : null;
    if (content) return content;
  }

  return labelFallback(flattened.values);
};

export { inheritedCellContent };
