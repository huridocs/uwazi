// const propertyTypes = {
//   date: 'date' as 'date', ---- ?
//   daterange: 'daterange' as 'daterange', ---- ?
//   geolocation: 'geolocation' as 'geolocation', ---- NO
//   image: 'image' as 'image', ---- NO
//   link: 'link' as 'link', ---- NO
//   markdown: 'markdown' as 'markdown', ---- YES
//   media: 'media' as 'media', ---- NO
//   multidate: 'multidate' as 'multidate', ---- ?
//   multidaterange: 'multidaterange' as 'multidaterange', ---- ?
//   multiselect: 'multiselect' as 'multiselect', ---- YES
//   nested: 'nested' as 'nested', ---- ?
//   numeric: 'numeric' as 'numeric', ---- NO
//   preview: 'preview' as 'preview', ---- NO
//   relationship: 'relationship' as 'relationship', ---- NO
//   select: 'select' as 'select', ---- YES
//   text: 'text' as 'text', ---- YES
//   generatedid: 'generatedid' as 'generatedid', ---- NO
//   newRelationship: 'newRelationship' as 'newRelationship', ---- NO
// };

import { templateUtils } from 'api/templates';
import _ from 'lodash';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { peekHeaders } from './csv';
import { notTranslated } from './entityRow';
import { ImportFile } from './importFile';

const PROPERTIES_WITH_LANGUAGE = new Set([
  propertyTypes.text,
  propertyTypes.markdown,
  propertyTypes.select,
  propertyTypes.multiselect,
  'title',
]);

class ArrangeColumnsError extends Error {}

const readColumns = async (
  file: ImportFile,
  template: TemplateSchema,
  availableLanguages: string[],
  newNameGeneration: boolean
): Promise<{
  propertiesByName: Record<string, PropertySchema>;
  headersWithoutLanguage: string[];
  languagesPerHeader: Record<string, Set<string>>;
}> => {
  const propertiesByName = objectIndex(
    template.properties || [],
    p => p.name,
    p => p
  );
  propertiesByName.title = { label: 'title', name: 'title', type: 'text' };
  const headers = await peekHeaders(await file.readStream());
  const safeNameHeaders = headers.map(h => templateUtils.safeName(h, newNameGeneration));
  const doesNotHaveLanguage = notTranslated(availableLanguages);
  const [headersWithoutLanguage, headersWithLanguage] = _.partition(safeNameHeaders, h =>
    doesNotHaveLanguage(h)
  );
  const languagesPerHeader: Record<string, Set<string>> = {};
  headersWithLanguage.forEach(h => {
    const [name, l] = h.split('__');
    languagesPerHeader[name] = languagesPerHeader[name] || new Set();
    languagesPerHeader[name].add(l);
  });
  return { propertiesByName, headersWithoutLanguage, languagesPerHeader };
};

const shouldExistInTemplate = (
  propertiesByName: Record<string, PropertySchema>,
  headersWithoutLanguage: string[],
  languagesPerHeader: Record<string, Set<string>>
): void => {
  headersWithoutLanguage.forEach(h => {
    if (!propertiesByName[h]) {
      throw new ArrangeColumnsError(`Property "${h}" does not exist in the template.`);
    }
  });
  Object.keys(languagesPerHeader).forEach(h => {
    if (!propertiesByName[h]) {
      throw new ArrangeColumnsError(`Property "${h}" does not exist in the template.`);
    }
  });
};

const shouldNotBeInBoth = (
  headersWithoutLanguage: string[],
  languagesPerHeader: Record<string, Set<string>>
): void => {
  const inBoth = _.intersection(headersWithoutLanguage, Object.keys(languagesPerHeader));
  if (inBoth.length) {
    throw new ArrangeColumnsError(`Properties "${inBoth}" mix language and non-language columns.
    Make sure to have either one column without language, or columns with languages.`);
  }
};

const languageColumnsShouldSupportLanguage = (
  propertiesByName: Record<string, PropertySchema>,
  languagesPerHeader: Record<string, Set<string>>
): void => {
  Object.keys(languagesPerHeader).forEach(h => {
    if (!PROPERTIES_WITH_LANGUAGE.has(propertiesByName[h].type)) {
      throw new ArrangeColumnsError(
        `Property "${h}" does not support languages. Remove the language suffix from the column name.`
      );
    }
  });
};

const languageColumnsShouldHaveDefaultLanguage = (
  languagesPerHeader: Record<string, Set<string>>,
  defaultLanguage: string
): void => {
  Object.keys(languagesPerHeader).forEach(h => {
    if (!languagesPerHeader[h].has(defaultLanguage)) {
      throw new ArrangeColumnsError(
        `Property "${h}" uses languages, but does not have a default language column.
       Properties using multiple languages should always have a column for the default language.`
      );
    }
  });
};

const validateColumns = async (
  file: ImportFile,
  template: TemplateSchema,
  availableLanguages: string[],
  defaultLanguage: string,
  newNameGeneration: boolean
): Promise<void> => {
  const { propertiesByName, headersWithoutLanguage, languagesPerHeader } = await readColumns(
    file,
    template,
    availableLanguages,
    newNameGeneration
  );

  shouldExistInTemplate(propertiesByName, headersWithoutLanguage, languagesPerHeader);
  shouldNotBeInBoth(headersWithoutLanguage, languagesPerHeader);
  languageColumnsShouldSupportLanguage(propertiesByName, languagesPerHeader);
  languageColumnsShouldHaveDefaultLanguage(languagesPerHeader, defaultLanguage);
};

export { validateColumns, ArrangeColumnsError };
