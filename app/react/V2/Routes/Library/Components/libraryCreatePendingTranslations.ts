import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';

type TranslationRow = {
  language: string;
  title?: string;
  metadata?: Record<string, MetadataObjectSchema[] | undefined>;
  translations?: EntityTranslationsDTO;
};

type CreateTranslationRead =
  { status: 'found'; translations: EntityTranslationsDTO } | { status: 'empty' };

const createOmittedLanguages = (
  sent: EntityTranslationsDTO | undefined,
  installed: readonly string[],
  current: string
) => installed.filter(language => language !== current && !Object.hasOwn(sent ?? {}, language));

const isLinkValue = (value: unknown): value is { label?: unknown; url?: unknown } =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  ('label' in value || 'url' in value);

const entryHasText = (entry: MetadataObjectSchema) => {
  if (typeof entry.value === 'string') return entry.value.length > 0;
  if (!isLinkValue(entry.value)) return false;
  const { label, url } = entry.value;
  return (
    (typeof label === 'string' && label.length > 0) || (typeof url === 'string' && url.length > 0)
  );
};

const sourceText = (row: TranslationRow, property: string) => {
  if (property === 'title') return row.title;
  const value = row.metadata?.[property]?.[0]?.value;
  return typeof value === 'string' ? value : undefined;
};

const filledBucket = (bucket: Record<string, MetadataObjectSchema[]>, row: TranslationRow) => {
  const next: Record<string, MetadataObjectSchema[]> = {};
  Object.entries(bucket).forEach(([property, entries]) => {
    const source = sourceText(row, property);
    const filled = entries.filter(entry => {
      const copied =
        typeof entry.value === 'string' && source !== undefined && entry.value === source;
      return entryHasText(entry) && !copied;
    });
    if (filled.length > 0) next[property] = filled;
  });
  return next;
};

const readCreatedTranslations = (
  rows: readonly TranslationRow[] | undefined,
  omitted: readonly string[],
  current: string
): CreateTranslationRead => {
  const row = rows?.find(item => item.language === current) ?? rows?.[0];
  if (!row) return { status: 'empty' };
  const found: EntityTranslationsDTO = {};
  omitted.forEach(language => {
    const bucket = row.translations?.[language];
    if (!bucket) return;
    const filled = filledBucket(bucket, row);
    if (Object.keys(filled).length > 0) found[language] = filled;
  });
  return Object.keys(found).length > 0
    ? { status: 'found', translations: found }
    : { status: 'empty' };
};

export { createOmittedLanguages, readCreatedTranslations };
