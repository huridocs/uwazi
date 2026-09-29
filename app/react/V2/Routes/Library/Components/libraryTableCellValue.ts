import { t } from '#app/I18N/index.js';
import type { DisplayContext } from '#V2/Components/Metadata/display/displayContext.js';
import {
  formatMetadataTimestamp,
  normalizeTimestamp,
} from '#V2/Components/Metadata/display/formatMetadataTimestamp.js';
import { secondsToDate } from '#V2/shared/dateHelpers.js';

type LibraryTableCellValue = {
  text: string;
  interactive: boolean;
};

type RawMetadataValue = {
  value?: unknown;
  label?: string;
  alt?: string;
  title?: string;
  parent?: { label?: string };
};

const INTERACTIVE_TYPES = new Set(['geolocation', 'media', 'image', 'preview']);

const asValues = (values: unknown): RawMetadataValue[] => {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter(
    (value): value is RawMetadataValue => Boolean(value) && typeof value === 'object'
  );
};

const fileNameFromUrl = (value: string): string => {
  const withoutQuery = value.split('?')[0] || value;
  const parts = withoutQuery.split('/');
  return parts[parts.length - 1] || value;
};

const mediaText = (item: RawMetadataValue): string => {
  if (item.alt) {
    return item.alt;
  }
  if (typeof item.value !== 'string') {
    return '';
  }
  if (item.value.startsWith('(')) {
    const match = item.value.match(/^\(([^,]+)/);
    return match?.[1] ? fileNameFromUrl(match[1].trim()) : '';
  }
  return fileNameFromUrl(item.value);
};

const coordinateNumber = (value: Record<string, unknown>, keys: string[]): number | undefined => {
  const found = keys.map(key => value[key]).find(item => typeof item === 'number');
  return typeof found === 'number' ? found : undefined;
};

const geoText = (item: RawMetadataValue): string => {
  if (item.label) {
    return item.label;
  }
  if (!item.value || typeof item.value !== 'object') {
    return '';
  }
  const point = item.value as Record<string, unknown>;
  const latitude = coordinateNumber(point, ['lat', 'latitude']);
  const longitude = coordinateNumber(point, ['lon', 'longitude']);
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${t('System', 'Latitude', null, false)}: ${latitude}, ${t('System', 'Longitude', null, false)}: ${longitude}`;
  }
  return '';
};

const nestedText = (item: RawMetadataValue): string => {
  if (item.label) {
    return item.label;
  }
  if (typeof item.value === 'string') {
    return item.value;
  }
  if (!item.value || typeof item.value !== 'object') {
    return '';
  }
  return Object.values(item.value as Record<string, unknown>)
    .flatMap(value => (Array.isArray(value) ? value : [value]))
    .map(value => (value === null || value === undefined ? '' : String(value)))
    .filter(Boolean)
    .join(' ');
};

const dateText = (item: RawMetadataValue, context: DisplayContext): string => {
  if (typeof item.value === 'number') {
    return formatMetadataTimestamp(item.value, context);
  }
  if (item.value && typeof item.value === 'object') {
    const range = item.value as { from?: number; to?: number };
    const from = typeof range.from === 'number' ? formatMetadataTimestamp(range.from, context) : '';
    const to = typeof range.to === 'number' ? formatMetadataTimestamp(range.to, context) : '';
    if (from && to) {
      return `${from} ~ ${to}`;
    }
    return from || to;
  }
  return '';
};

const selectText = (item: RawMetadataValue): string => {
  const base = item.label || (typeof item.value === 'string' ? item.value : '');
  if (item.parent?.label) {
    return `${item.parent.label} › ${base}`;
  }
  return base;
};

const valueText = (type: string, item: RawMetadataValue, context: DisplayContext): string => {
  switch (type) {
    case 'geolocation':
      return geoText(item);
    case 'media':
    case 'image':
    case 'preview':
      return mediaText(item);
    case 'nested':
      return nestedText(item);
    case 'date':
    case 'multidate':
    case 'daterange':
    case 'multidaterange':
      return dateText(item, context);
    case 'select':
    case 'multiselect':
      return selectText(item);
    case 'relationship':
    case 'newRelationship':
      return item.title || item.label || (typeof item.value === 'string' ? item.value : '');
    case 'link':
      return item.label || (typeof item.value === 'string' ? item.value : '');
    default:
      if (item.label) {
        return item.label;
      }
      if (item.value === null || item.value === undefined) {
        return '';
      }
      return String(item.value);
  }
};

const libraryTableCellValue = (
  propertyType: string,
  values: unknown,
  context: DisplayContext
): LibraryTableCellValue => {
  const text = asValues(values)
    .map(item => valueText(propertyType, item, context))
    .filter(Boolean)
    .join(', ');
  return {
    text,
    interactive: Boolean(text) && INTERACTIVE_TYPES.has(propertyType),
  };
};

const formatLibraryTableDate = (timestamp: unknown, context: DisplayContext): string => {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return '';
  }
  return secondsToDate(normalizeTimestamp(timestamp), context.locale);
};

export type { LibraryTableCellValue };
export { formatLibraryTableDate, libraryTableCellValue };
