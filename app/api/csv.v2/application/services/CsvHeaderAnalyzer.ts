import { Template } from '#api/core/domain/template/Template.js';
import { Property } from '#api/core/domain/template/Property.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { PropertyName } from '#api/core/domain/template/PropertyName.js';
import { CsvHeaderAnalyzerError, AnalyzerIssue } from './CsvHeaderAnalyzerError.js';

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

const shouldAllowLanguageColumn = (property: Property) =>
  property.name === 'title' || LANGUAGE_SUPPORTED_TYPES.has(property.type as PropertyType);

const collectMixedColumnsIssues = (
  languagesPerHeader: LanguagesPerHeader,
  headersWithoutLanguage: string[],
  issues: AnalyzerIssue[]
) => {
  const mixedColumns = Object.keys(languagesPerHeader).filter(headerName =>
    headersWithoutLanguage.includes(headerName)
  );
  if (mixedColumns.length) {
    issues.push({
      reason: 'MixedLanguageColumns',
      message: `Properties "${mixedColumns.join(
        ', '
      )}" mix language and non-language columns. Make sure to only use either suffixed or non-suffixed columns for each property.`,
      columns: mixedColumns,
    });
  }
};

const collectUnsupportedLanguageIssues = (
  template: Template,
  languagesPerHeader: LanguagesPerHeader,
  propertiesByName: Record<string, Property>,
  issues: AnalyzerIssue[]
) => {
  Object.keys(languagesPerHeader).forEach(headerName => {
    if (headerName === 'file') {
      return;
    }
    const property = propertiesByName[headerName];
    if (!property) {
      issues.push({
        reason: 'UnknownProperty',
        message: `Column "${headerName}" does not exist in template "${template.name}".`,
        property: headerName,
      });
      return;
    }
    if (!shouldAllowLanguageColumn(property)) {
      issues.push({
        reason: 'UnsupportedLanguageColumn',
        message: `Property "${property.name}" does not support languages. Remove the language suffix from the column name.`,
        property: property.name,
      });
    }
  });
};

const collectMissingDefaultLanguageIssues = (
  languagesPerHeader: LanguagesPerHeader,
  defaultLanguage: string,
  issues: AnalyzerIssue[]
) => {
  Object.entries(languagesPerHeader).forEach(([headerName, languages]) => {
    if (!languages.has(defaultLanguage)) {
      issues.push({
        reason: 'MissingDefaultLanguage',
        message: `Property "${headerName}" uses languages, but does not have the default language column.`,
        property: headerName,
      });
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

    const issues: AnalyzerIssue[] = [];
    collectMixedColumnsIssues(languagesPerHeader, headersWithoutLanguage, issues);
    collectUnsupportedLanguageIssues(template, languagesPerHeader, propertiesByName, issues);
    collectMissingDefaultLanguageIssues(languagesPerHeader, options.defaultLanguage, issues);

    if (issues.length) {
      throw new CsvHeaderAnalyzerError(issues);
    }

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
