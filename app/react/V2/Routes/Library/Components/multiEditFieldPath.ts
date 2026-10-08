import type { FieldValues, Path } from 'react-hook-form';
import { isTranslatableProperty } from './translatableProperty.js';

const wholeValueTypes = new Set([
  'select',
  'multiselect',
  'relationship',
  'nested',
  'multidate',
  'multidaterange',
  'geolocation',
]);

const fieldPath = (
  property: { name: string; type: string },
  language: string | undefined,
  activeLanguage: string
): Path<FieldValues> => {
  const prefix = language && language !== activeLanguage ? `translations.${language}` : 'metadata';
  const leaf =
    !isTranslatableProperty(property.type) && wholeValueTypes.has(property.type)
      ? property.name
      : `${property.name}.0.value`;

  return `${prefix}.${leaf}` as Path<FieldValues>;
};

export { fieldPath };
