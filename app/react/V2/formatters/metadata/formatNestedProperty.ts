import type { Entity } from '#V2/api/entities/types.js';
import nestedPropertyLabels from '#app/Templates/components/ViolatedArticlesNestedProperties.js';
import type { BaseMetadataProperty, SimpleMetadataProperty } from '../types.js';
import { resolvePropertyMetadataValues } from './resolvePropertyMetadataValues.js';

const nestedLabelMap: Record<string, Record<string, string>> = nestedPropertyLabels;

type NestedRowObject = Record<string, unknown>;

const isNestedRowObject = (value: unknown): value is NestedRowObject =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const cellText = (column: unknown): string => {
  if (!Array.isArray(column)) {
    return '';
  }
  return column.map(v => (v === null || v === undefined ? '' : String(v))).join(', ');
};

const translateColumnHeader = (key: string, locale: string): string => {
  const entry = nestedLabelMap[key.toLowerCase()];
  if (!entry) {
    return key;
  }
  const localized = entry[`key_${locale}`];
  return typeof localized === 'string' ? localized : key;
};

function nestedTableHeaderAndDivider(keys: string[], locale: string): [string, string] {
  return [
    `| ${keys.map(k => translateColumnHeader(k, locale)).join(' | ')} |`,
    `| ${keys.map(() => '-').join(' | ')} |`,
  ];
}

function nestedTableDataLines(rows: Array<{ value?: unknown }>, keys: string[]): string[] {
  return rows
    .map(row => {
      const rowValue = row.value;
      if (!isNestedRowObject(rowValue)) {
        return null;
      }
      return `| ${keys.map(key => cellText(rowValue[key])).join(' | ')} |`;
    })
    .filter((line): line is string => line !== null);
}

function sortedKeysFromFirstRow(rows: Array<{ value?: unknown }>): string[] | null {
  const first = rows[0]?.value;
  if (!isNestedRowObject(first)) {
    return null;
  }
  const keys = Object.keys(first).sort();
  return keys.length === 0 ? null : keys;
}

function buildNestedMarkdown(rows: Array<{ value?: unknown }>, locale: string): string | null {
  const keys = sortedKeysFromFirstRow(rows);
  if (keys === null) {
    return null;
  }

  const [headerRow, dividerRow] = nestedTableHeaderAndDivider(keys, locale);
  const dataRows = nestedTableDataLines(rows, keys);

  if (dataRows.length === 0) {
    return null;
  }

  return [headerRow, dividerRow, ...dataRows].join('\n');
}

const formatNestedProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  locale?: string
): SimpleMetadataProperty | null => {
  if (property.type !== 'nested') {
    return null;
  }

  const rows = resolvePropertyMetadataValues(property, metadata);
  const shortLocale = locale && /^[a-z]{2}/i.test(locale) ? locale.slice(0, 2).toLowerCase() : 'en';
  const markdown = buildNestedMarkdown(rows, shortLocale);
  if (markdown === null) {
    return null;
  }

  return {
    _id: property._id,
    name: property.name,
    label: property.label,
    type: 'markdown',
    values: [{ value: markdown }],
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };
};

export { formatNestedProperty };
