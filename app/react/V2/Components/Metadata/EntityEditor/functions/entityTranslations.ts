import type { LanguagesListSchema, MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';
import { toMetadataObjectSchema } from './toMetadataObjectSchema.js';
import { metadataFormKey } from './metadataFormKey.js';

const TRANSLATABLE_METADATA_TYPES = new Set([
  'text',
  'markdown',
  'link',
  'image',
  'media',
  'preview',
]);

const isTranslatableMetadataType = (type: string) => TRANSLATABLE_METADATA_TYPES.has(type);

const installedLanguageKeys = (languages: LanguagesListSchema) =>
  languages.filter(language => !language.installing).map(language => language.key);

const textValues = (text: string): MetadataObjectSchema[] => [{ value: text }];

const stringFromValues = (values?: MetadataObjectSchema[]): string => {
  const value = values?.[0]?.value;
  return typeof value === 'string' ? value : '';
};

type LinkPart = 'label' | 'url';

type LinkParts = { label: string; url: string };

const isLinkRecord = (value: unknown): value is { label?: unknown; url?: unknown } =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  ('label' in value || 'url' in value);

const linkPartText = (value: unknown, part: LinkPart) => {
  if (!isLinkRecord(value)) return '';
  const text = value[part];
  return typeof text === 'string' ? text : '';
};

const linkValueWithPart = ({
  existing,
  fallback,
  part,
  text,
}: {
  existing: unknown;
  fallback: unknown;
  part: LinkPart;
  text: string;
}): LinkParts => {
  const candidate = isLinkRecord(existing) ? existing : fallback;
  const record = isLinkRecord(candidate) ? candidate : {};
  const label = typeof record.label === 'string' ? record.label : '';
  const url = typeof record.url === 'string' ? record.url : '';
  if (part === 'label') return { label: text, url };
  return { label, url: text };
};

const storedTranslationValue = (entry: unknown): unknown => {
  if (!Array.isArray(entry) || entry.length === 0) return undefined;
  const first: unknown = entry[0];
  if (typeof first === 'object' && first !== null && 'value' in first) return first.value;
  return undefined;
};

const translationEntryText = (entry: unknown, part?: LinkPart) => {
  const stored = storedTranslationValue(entry);
  if (part) return linkPartText(stored, part);
  return typeof stored === 'string' ? stored : '';
};

const toFormMetadataValues = (values?: MetadataObjectSchema[]): MetadataValue[] =>
  (values ?? []).map(entry => ({
    value: entry.value,
    ...(typeof entry.label === 'string' ? { label: entry.label } : {}),
  }));

const translatableProperties = (metadataProperties: FormMetadataProperty[]) =>
  metadataProperties.filter(property => isTranslatableMetadataType(property.type));

const bucketFromCurrent = (
  values: EditEntityFormValues,
  metadataProperties: FormMetadataProperty[]
): Record<string, MetadataObjectSchema[]> => {
  const bucket: Record<string, MetadataObjectSchema[]> = {
    title: textValues(values.title),
  };
  translatableProperties(metadataProperties).forEach(property => {
    const formKey = metadataFormKey(property.name);
    bucket[formKey] = (values.metadata[formKey] ?? []).map(toMetadataObjectSchema);
  });
  return bucket;
};

const rekeyEditEntityLanguage = ({
  values,
  fromLanguage,
  toLanguage,
  metadataProperties,
}: {
  values: EditEntityFormValues;
  fromLanguage: string;
  toLanguage: string;
  metadataProperties: FormMetadataProperty[];
}): EditEntityFormValues => {
  if (fromLanguage === toLanguage) return values;
  const toBucket = values.translations?.[toLanguage] ?? {};
  const nextTranslations = { ...(values.translations ?? {}) };
  delete nextTranslations[toLanguage];
  nextTranslations[fromLanguage] = bucketFromCurrent(values, metadataProperties);
  const nextTouched = { ...(values.touchedTranslations ?? {}) };
  delete nextTouched[toLanguage];
  const nextMetadata = { ...values.metadata };
  translatableProperties(metadataProperties).forEach(property => {
    const formKey = metadataFormKey(property.name);
    nextMetadata[formKey] = toFormMetadataValues(toBucket[formKey]);
  });
  return {
    ...values,
    title: stringFromValues(toBucket.title),
    metadata: nextMetadata,
    translations: nextTranslations,
    touchedTranslations: nextTouched,
  };
};

const isMissingTranslation = (values?: MetadataObjectSchema[]) => !values?.length;

const isBlankTitle = (values?: MetadataObjectSchema[]) =>
  isMissingTranslation(values) || (values?.length === 1 && values[0]?.value === '');

const setTranslationTouched = ({
  touched,
  language,
  propertyName,
}: {
  touched: Record<string, Record<string, boolean>>;
  language: string;
  propertyName: string;
}): Record<string, Record<string, boolean>> => ({
  ...touched,
  [language]: { ...touched[language], [propertyName]: true },
});

const pickTranslationValue = ({
  existing,
  fallback,
  touched,
  blankFallsBack,
}: {
  existing: MetadataObjectSchema[] | undefined;
  fallback: MetadataObjectSchema[];
  touched: boolean;
  blankFallsBack: boolean;
}): MetadataObjectSchema[] => {
  if (blankFallsBack && isBlankTitle(existing)) return fallback;
  if (touched) return existing ?? textValues('');
  return isMissingTranslation(existing) ? fallback : (existing ?? fallback);
};

const completeLanguageBucket = ({
  bucket,
  fallback,
  metadataProperties,
  touched,
}: {
  bucket: Record<string, MetadataObjectSchema[]>;
  fallback: Record<string, MetadataObjectSchema[]>;
  metadataProperties: FormMetadataProperty[];
  touched: Record<string, boolean>;
}): Record<string, MetadataObjectSchema[]> => {
  const next: Record<string, MetadataObjectSchema[]> = {
    title: pickTranslationValue({
      existing: bucket.title,
      fallback: fallback.title,
      touched: Boolean(touched.title),
      blankFallsBack: true,
    }),
  };
  translatableProperties(metadataProperties).forEach(property => {
    const formKey = metadataFormKey(property.name);
    next[property.name] = pickTranslationValue({
      existing: bucket[formKey],
      fallback: fallback[formKey],
      touched: Boolean(touched[formKey]),
      blankFallsBack: Boolean(property.required),
    });
  });
  return next;
};

const buildTranslationsForSave = ({
  values,
  metadataProperties,
  languages,
  currentLanguage,
}: {
  values: EditEntityFormValues;
  metadataProperties: FormMetadataProperty[];
  languages: LanguagesListSchema;
  currentLanguage: string;
}): EntityTranslationsDTO | undefined => {
  const keys = installedLanguageKeys(languages);
  if (keys.length < 2) return undefined;
  const fallback = bucketFromCurrent(values, metadataProperties);
  return Object.fromEntries(
    keys
      .filter(key => key !== currentLanguage)
      .map(key => [
        key,
        completeLanguageBucket({
          bucket: values.translations?.[key] ?? {},
          fallback,
          metadataProperties,
          touched: values.touchedTranslations?.[key] ?? {},
        }),
      ])
  );
};

const setTranslationText = ({
  translations,
  language,
  propertyName,
  value,
}: {
  translations: EntityTranslationsDTO;
  language: string;
  propertyName: string;
  value: string;
}): EntityTranslationsDTO => ({
  ...translations,
  [language]: {
    ...(translations[language] ?? {}),
    [propertyName]: textValues(value),
  },
});

const translationValuePath = (language: string, propertyName: string) =>
  `translations.${language}.${metadataFormKey(propertyName)}`;

const translationTouchedPath = (language: string, propertyName: string) =>
  `touchedTranslations.${language}.${metadataFormKey(propertyName)}`;

export {
  buildTranslationsForSave,
  installedLanguageKeys,
  linkValueWithPart,
  rekeyEditEntityLanguage,
  setTranslationText,
  setTranslationTouched,
  storedTranslationValue,
  stringFromValues,
  translationEntryText,
  translationTouchedPath,
  translationValuePath,
};
export type { LinkPart };
