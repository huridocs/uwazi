import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';

const storedParkedValue = (values?: MetadataObjectSchema[]) => {
  const first = values?.[0];
  if (!first || typeof first !== 'object' || !('value' in first)) return undefined;
  return first.value;
};

const isLinkParts = (value: unknown): value is { label?: unknown; url?: unknown } =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  ('label' in value || 'url' in value);

const parkedValueHasText = (values?: MetadataObjectSchema[]) => {
  const stored = storedParkedValue(values);
  if (typeof stored === 'string') return stored.length > 0;
  if (!isLinkParts(stored)) return false;
  const { label, url } = stored;
  return (
    (typeof label === 'string' && label.length > 0) || (typeof url === 'string' && url.length > 0)
  );
};

const touchForParkedBucket = (bucket: Record<string, MetadataObjectSchema[]>) => {
  const touched: Record<string, boolean> = {};
  Object.entries(bucket).forEach(([name, parked]) => {
    if (parkedValueHasText(parked)) touched[name] = true;
  });
  return touched;
};

const parkCurrentLanguage = ({
  values,
  fromLanguage,
  toLanguage,
  parkedBucket,
}: {
  values: EditEntityFormValues;
  fromLanguage: string;
  toLanguage: string;
  parkedBucket: Record<string, MetadataObjectSchema[]>;
}) => {
  const toBucket = values.translations?.[toLanguage] ?? {};
  const translations = { ...(values.translations ?? {}) };
  delete translations[toLanguage];
  translations[fromLanguage] = parkedBucket;
  const touchedTranslations = { ...(values.touchedTranslations ?? {}) };
  delete touchedTranslations[toLanguage];
  const parkedTouch = touchForParkedBucket(parkedBucket);
  if (Object.keys(parkedTouch).length > 0) {
    touchedTranslations[fromLanguage] = { ...touchedTranslations[fromLanguage], ...parkedTouch };
  }
  return { toBucket, translations, touchedTranslations };
};

export { parkCurrentLanguage };
