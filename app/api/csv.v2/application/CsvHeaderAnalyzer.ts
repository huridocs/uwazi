import { Template } from 'api/core/domain/template/Template';
import { Property } from 'api/core/domain/template/Property';
import { PropertyType } from 'api/core/domain/template/PropertyType';
import { PropertyName } from 'api/core/domain/template/PropertyName';
import { CsvHeaderAnalyzerError } from './CsvHeaderAnalyzerError';

const LANGUAGE_HEADER_SEPARATOR = '__';
const LANGUAGE_SUPPORTED_TYPES = new Set<PropertyType>([
  'text',
  'markdown',
  'select',
  'multiselect',
  'link',
  'nested',
]);

type LanguagesPerHeader = Record<string, Set<string>>;
type SanitizedHeader = { original: string; sanitized: string };
type PartitionResult = {
  headersWithoutLanguage: string[];
  languagesPerHeader: LanguagesPerHeader;
};
type AnalyzerOptions = {
  availableLanguages: string[];
  defaultLanguage: string;
  newNameGeneration: boolean;
};
type HeaderAnalysis = {
  headersWithoutLanguage: string[];
  languagesPerHeader: LanguagesPerHeader;
  propertiesByName: Record<string, Property>;
  defaultLanguage: string;
};

const sanitizeHeaders = (headers: string[], newNameGeneration: boolean): SanitizedHeader[] =>
  headers.map(header => ({
    original: header,
    sanitized: PropertyName.fromLabel(header, { newNameGeneration }).value,
  }));

const detectLanguageSuffix = (header: string, languages: string[]) => {
  for (const language of languages) {
    const suffix = `${LANGUAGE_HEADER_SEPARATOR}${language}`;
    if (header.endsWith(suffix)) {
      return { language, suffix };
    }
  }
  return undefined;
};

const partitionHeaders = (
  sanitizedHeaders: SanitizedHeader[],
  languages: string[]
): PartitionResult =>
  sanitizedHeaders.reduce<PartitionResult>(
    (acc, { sanitized }) => {
      const detected = detectLanguageSuffix(sanitized, languages);
      if (!detected) {
        acc.headersWithoutLanguage.push(sanitized);
        return acc;
      }
      const base = sanitized.slice(0, sanitized.length - detected.suffix.length);
      const existing = acc.languagesPerHeader[base] ?? new Set<string>();
      existing.add(detected.language);
      acc.languagesPerHeader[base] = existing;
      return acc;
    },
    { headersWithoutLanguage: [], languagesPerHeader: {} }
  );

const buildPropertiesByName = (template: Template) =>
  template.allProperties.reduce<Record<string, Property>>((acc, property) => {
    acc[property.name] = property;
    return acc;
  }, {});

const ensureNoMixedColumns = (
  languagesPerHeader: LanguagesPerHeader,
  headersWithoutLanguage: string[]
) => {
  const mixedColumns = Object.keys(languagesPerHeader).filter(headerName =>
    headersWithoutLanguage.includes(headerName)
  );
  if (mixedColumns.length) {
    throw new CsvHeaderAnalyzerError(
      'MixedLanguageColumns',
      `Properties "${mixedColumns.join(
        ', '
      )}" mix language and non-language columns. Make sure to only use either suffixed or non-suffixed columns for each property.`,
      { columns: mixedColumns }
    );
  }
};

const shouldAllowLanguageColumn = (property: Property) =>
  property.name === 'title' || LANGUAGE_SUPPORTED_TYPES.has(property.type as PropertyType);

const ensureSupportedLanguageColumns = (
  template: Template,
  languagesPerHeader: LanguagesPerHeader,
  propertiesByName: Record<string, Property>
) => {
  Object.keys(languagesPerHeader).forEach(headerName => {
    if (headerName === 'file') {
      return;
    }
    const property = propertiesByName[headerName];
    if (!property) {
      throw new CsvHeaderAnalyzerError(
        'UnknownProperty',
        `Column "${headerName}" does not exist in template "${template.name}".`,
        { property: headerName }
      );
    }
    if (!shouldAllowLanguageColumn(property)) {
      throw new CsvHeaderAnalyzerError(
        'UnsupportedLanguageColumn',
        `Property "${property.name}" does not support languages. Remove the language suffix from the column name.`,
        { property: property.name }
      );
    }
  });
};

const ensureDefaultLanguageColumns = (
  languagesPerHeader: LanguagesPerHeader,
  defaultLanguage: string
) => {
  Object.entries(languagesPerHeader).forEach(([headerName, languages]) => {
    if (!languages.has(defaultLanguage)) {
      throw new CsvHeaderAnalyzerError(
        'MissingDefaultLanguage',
        `Property "${headerName}" uses languages, but does not have the default language column.`,
        { property: headerName }
      );
    }
  });
};

class CsvHeaderAnalyzer {
  static analyze(headers: string[], template: Template, options: AnalyzerOptions): HeaderAnalysis {
    const sanitizedHeaders = sanitizeHeaders(headers, options.newNameGeneration);
    const { headersWithoutLanguage, languagesPerHeader } = partitionHeaders(
      sanitizedHeaders,
      options.availableLanguages
    );
    const propertiesByName = buildPropertiesByName(template);

    ensureNoMixedColumns(languagesPerHeader, headersWithoutLanguage);
    ensureSupportedLanguageColumns(template, languagesPerHeader, propertiesByName);
    ensureDefaultLanguageColumns(languagesPerHeader, options.defaultLanguage);

    return {
      headersWithoutLanguage,
      languagesPerHeader,
      propertiesByName,
      defaultLanguage: options.defaultLanguage,
    };
  }
}

export { CsvHeaderAnalyzer };
export type { HeaderAnalysis, LanguagesPerHeader, AnalyzerOptions };
