import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';

type TranslationRow = {
  language: string;
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

const filledBucket = (bucket: Record<string, MetadataObjectSchema[]>) => {
  const next: Record<string, MetadataObjectSchema[]> = {};
  Object.entries(bucket).forEach(([property, entries]) => {
    const filled = entries.filter(entryHasText);
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
  const found: EntityTranslationsDTO = {};
  omitted.forEach(language => {
    const bucket = row?.translations?.[language];
    if (!bucket) return;
    const filled = filledBucket(bucket);
    if (Object.keys(filled).length > 0) found[language] = filled;
  });
  return Object.keys(found).length > 0
    ? { status: 'found', translations: found }
    : { status: 'empty' };
};

const withFoundTranslations = (
  current: EntityTranslationsDTO,
  found: EntityTranslationsDTO
): EntityTranslationsDTO => {
  const next: EntityTranslationsDTO = { ...current };
  Object.entries(found).forEach(([language, bucket]) => {
    next[language] = { ...current[language], ...bucket };
  });
  return next;
};

export { createOmittedLanguages, readCreatedTranslations, withFoundTranslations };
