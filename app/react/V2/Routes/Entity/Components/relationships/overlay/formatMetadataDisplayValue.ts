import { DateTime } from 'luxon';
import type { MetadataProperty } from '#V2/formatters/types.js';

const normalizeTimestamp = (timestamp: number) =>
  timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;

const formatTimestamp = (timestamp: number, locale: string) => {
  const luxonDate = DateTime.fromSeconds(normalizeTimestamp(timestamp), { zone: 'utc' }).setLocale(
    locale
  );
  return luxonDate.isValid ? luxonDate.toLocaleString(DateTime.DATE_MED) : '';
};

const formatSelectValue = (
  value: Extract<MetadataProperty, { type: 'select' }>['values'][number]
) => {
  const base = value.label || value.value;
  if (value.parent?.label) {
    return `${value.parent.label}: ${base}`;
  }
  return base;
};

const formatMetadataDisplayValue = (property: MetadataProperty, locale: string): string => {
  switch (property.type) {
    case 'text':
    case 'generatedid':
    case 'numeric':
    case 'markdown':
      return property.values
        .map(value => String(value.value ?? ''))
        .filter(Boolean)
        .join(', ');
    case 'date':
    case 'multidate':
      return property.values
        .map(value => (typeof value.value === 'number' ? formatTimestamp(value.value, locale) : ''))
        .filter(Boolean)
        .join(', ');
    case 'daterange':
    case 'multidaterange':
      return property.values
        .map(value => {
          const from =
            typeof value.value.from === 'number' ? formatTimestamp(value.value.from, locale) : '';
          const to =
            typeof value.value.to === 'number' ? formatTimestamp(value.value.to, locale) : '';
          if (from && to) return `${from} ~ ${to}`;
          return from || to;
        })
        .filter(Boolean)
        .join(', ');
    case 'select':
    case 'multiselect':
      return property.values.map(formatSelectValue).filter(Boolean).join(', ');
    case 'link':
      return property.values
        .map(value => value.label || value.value)
        .filter(Boolean)
        .join(', ');
    case 'relationship':
      if (property.mode === 'inherited') {
        return property.values
          .map(value => formatMetadataDisplayValue(value, locale))
          .filter(Boolean)
          .join(', ');
      }
      return property.values
        .map(value => value.title)
        .filter(Boolean)
        .join(', ');
    case 'geolocation':
      return property.values
        .map(value => {
          const { latitude, longitude } = value.value;
          if (value.label) return value.label;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            return `${latitude}, ${longitude}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');
    case 'media':
    case 'image':
    case 'preview':
      return property.values
        .map(value => value.alt || value.value)
        .filter(Boolean)
        .join(', ');
    default:
      return '';
  }
};

export { formatMetadataDisplayValue, formatTimestamp };
