import type { MetadataValue } from '#V2/formatters/types.js';

type NestedRow = Record<string, string[]>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNestedRow = (value: unknown): value is NestedRow =>
  isRecord(value) &&
  Object.values(value).every(
    column => Array.isArray(column) && column.every(item => typeof item === 'string')
  );

const metadataValuesToRows = (values: MetadataValue[] | undefined): NestedRow[] =>
  (values ?? []).map(entry => entry.value).filter(isNestedRow);

const rowsToMetadataValues = (rows: NestedRow[]): MetadataValue[] =>
  rows.map(row => ({ value: row }));

const rowsToMarkdown = (rows: NestedRow[]): string => {
  if (!rows[0]) {
    return '';
  }

  const keys = Object.keys(rows[0]).sort();
  const header = `| ${keys.join(' | ')} |`;
  const divider = `| ${keys.map(() => '-').join(' | ')} |`;
  const data = rows
    .map(row => `| ${keys.map(key => (row[key] ?? []).join(',')).join(' | ')} |`)
    .join('\n');

  return `${header}\n${divider}\n${data}`;
};

const markdownToRows = (markdown: string): NestedRow[] => {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split('\n').filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const keys = lines[0]
    .split('|')
    .map(key => key.trim())
    .filter(Boolean);

  if (!keys.length) {
    return [];
  }

  const dataLines = lines.slice(2);

  return dataLines
    .map(line =>
      line
        .split('|')
        .slice(1, keys.length + 1)
        .reduce<NestedRow>((row, cell, index) => {
          const key = keys[index];
          if (!key) {
            return row;
          }

          row[key] = cell
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);

          return row;
        }, {})
    )
    .filter(row => Object.keys(row).length > 0);
};

const markdownFromMetadataValues = (values: MetadataValue[] | undefined): string =>
  rowsToMarkdown(metadataValuesToRows(values));

const metadataValuesFromMarkdown = (markdown: string): MetadataValue[] =>
  rowsToMetadataValues(markdownToRows(markdown));

const nestedFieldHasValue = (values: MetadataValue[] | undefined): boolean =>
  metadataValuesToRows(values).some(row => Object.values(row).some(column => column.length > 0));

export {
  isNestedRow,
  metadataValuesToRows,
  rowsToMetadataValues,
  rowsToMarkdown,
  markdownToRows,
  markdownFromMetadataValues,
  metadataValuesFromMarkdown,
  nestedFieldHasValue,
};
export type { NestedRow };
