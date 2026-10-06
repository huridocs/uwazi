import { isTranslatableProperty } from './translatableProperty.js';

type EditProperty = { name: string; type: string };

type MultipleUpdateValues = {
  metadata?: Record<string, unknown[]>;
  translations?: Record<string, Record<string, unknown[]>>;
  template?: string;
};

type MultipleUpdateBody = {
  ids: string[];
  values: MultipleUpdateValues;
};

type BuildMultipleUpdateBodyInput = {
  ids: string[];
  activeLanguage: string;
  languages: string[];
  properties: EditProperty[];
  metadata: Record<string, unknown>;
  translations: Record<string, Record<string, unknown>>;
  templateId: string;
  initialTemplateId: string;
};

const hasContent = (value: unknown): boolean => {
  if (value == null || value === '') return false;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.some(hasContent);
  if (typeof value === 'object') return Object.values(value).some(hasContent);
  return false;
};

const asValues = (value: unknown): unknown[] | undefined => {
  if (!hasContent(value) || !Array.isArray(value)) return undefined;
  return value;
};

const otherLanguages = (languages: string[], activeLanguage: string) =>
  languages.filter(language => language !== activeLanguage);

const collectMetadata = (input: BuildMultipleUpdateBodyInput) => {
  const metadata: Record<string, unknown[]> = {};

  input.properties.forEach(property => {
    const value = asValues(input.metadata[property.name]);
    if (value) metadata[property.name] = value;
  });

  return metadata;
};

const collectTranslations = (input: BuildMultipleUpdateBodyInput) => {
  const translations: Record<string, Record<string, unknown[]>> = {};

  input.properties
    .filter(property => isTranslatableProperty(property.type))
    .forEach(property => {
      otherLanguages(input.languages, input.activeLanguage).forEach(language => {
        const value = asValues(input.translations[language]?.[property.name]);
        if (!value) return;
        translations[language] = { ...translations[language], [property.name]: value };
      });
    });

  return translations;
};

const buildMultipleUpdateBody = (
  input: BuildMultipleUpdateBodyInput
): MultipleUpdateBody | undefined => {
  const metadata = collectMetadata(input);
  const translations = collectTranslations(input);
  const template =
    input.templateId && input.templateId !== input.initialTemplateId ? input.templateId : undefined;

  if (!Object.keys(metadata).length && !Object.keys(translations).length && !template) {
    return undefined;
  }

  return {
    ids: input.ids,
    values: {
      ...(Object.keys(metadata).length ? { metadata } : {}),
      ...(Object.keys(translations).length ? { translations } : {}),
      ...(template ? { template } : {}),
    },
  };
};

export type { BuildMultipleUpdateBodyInput, MultipleUpdateBody };
export { buildMultipleUpdateBody };
