import type { LanguagesListSchema, MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';
import { toMetadataObjectSchema } from './toMetadataObjectSchema.js';

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
    bucket[property.name] = (values.metadata[property.name] ?? []).map(toMetadataObjectSchema);
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
  const nextMetadata = { ...values.metadata };
  translatableProperties(metadataProperties).forEach(property => {
    nextMetadata[property.name] = toFormMetadataValues(toBucket[property.name]);
  });
  return {
    ...values,
    title: stringFromValues(toBucket.title),
    metadata: nextMetadata,
    translations: nextTranslations,
  };
};

const isMissingTranslation = (values?: MetadataObjectSchema[]) =>
  values === undefined || values.length === 0;

const isBlankTitle = (values?: MetadataObjectSchema[]) =>
  isMissingTranslation(values) || (values.length === 1 && values[0]?.value === '');

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
}) => {
  if (touched) return existing ?? textValues('');
  if (blankFallsBack) return isBlankTitle(existing) ? fallback : existing;
  return isMissingTranslation(existing) ? fallback : existing;
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
    next[property.name] = pickTranslationValue({
      existing: bucket[property.name],
      fallback: fallback[property.name],
      touched: Boolean(touched[property.name]),
      blankFallsBack: false,
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

export {
  buildTranslationsForSave,
  installedLanguageKeys,
  rekeyEditEntityLanguage,
  setTranslationText,
  setTranslationTouched,
  stringFromValues,
};
