import { TemplateSchema } from 'shared/types/templateType';
import { propertyTypes } from 'shared/propertyTypes';

export type HeaderAnalysis = {
  headersWithoutLanguage: string[];
  languagesPerHeader: Record<string, Set<string>>;
  defaultLanguage: string;
};

export class CsvHeaderAnalyzer {
  static analyze(
    headers: string[],
    template: TemplateSchema,
    availableLanguages: string[],
    defaultLanguage: string
  ): HeaderAnalysis {
    const languageSuffix = (lang: string) => `__${lang}`;
    const isLangHeader = (h: string) => availableLanguages.some(l => h.endsWith(languageSuffix(l)));
    const headersWithoutLanguage = headers.filter(h => !isLangHeader(h));
    const languagesPerHeader: Record<string, Set<string>> = {};

    headers.filter(isLangHeader).forEach(h => {
      const lang = availableLanguages.find(l => h.endsWith(languageSuffix(l)))!;
      const base = h.slice(0, h.length - languageSuffix(lang).length);
      if (!languagesPerHeader[base]) languagesPerHeader[base] = new Set();
      languagesPerHeader[base].add(lang);
    });

    // Basic validation similar to v1 (reduced)
    Object.keys(languagesPerHeader).forEach(name => {
      const prop = (template.properties || []).find(p => p.name === name);
      if (!prop) return;
      const supportsLang = new Set([
        propertyTypes.text,
        propertyTypes.markdown,
        propertyTypes.select,
        propertyTypes.multiselect,
        propertyTypes.link,
        propertyTypes.nested,
        'title',
      ]).has(prop.type);
      if (!supportsLang) {
        throw new Error(
          `Property "${name}" does not support languages. Remove the language suffix from the column name.`
        );
      }
      if (!languagesPerHeader[name].has(defaultLanguage)) {
        throw new Error(
          `Property "${name}" uses languages, but does not have a default language column.`
        );
      }
    });

    return { headersWithoutLanguage, languagesPerHeader, defaultLanguage };
  }
}
