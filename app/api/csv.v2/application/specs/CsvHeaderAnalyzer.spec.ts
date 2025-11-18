import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { NumericProperty } from 'api/core/domain/template/NumericProperty';
import { SelectProperty } from 'api/core/domain/template/select/SelectProperty';
import { CsvHeaderAnalyzer } from '../CsvHeaderAnalyzer';

const TEMPLATE_ID = 'template-id';
const AVAILABLE_LANGUAGES = ['en', 'es'];
const DEFAULT_LANGUAGE = 'en';

const buildTemplate = () =>
  TemplateBuilder.aTemplate({ id: TEMPLATE_ID })
    .withProperties([
      new TextProperty({
        id: 'text-prop-id',
        label: 'Text Label',
        name: 'text_label',
        template: TEMPLATE_ID,
      }),
      new TextProperty({
        id: 'text-special-prop-id',
        label: 'Complex + Prop',
        name: 'complex+prop',
        template: TEMPLATE_ID,
      }),
      new NumericProperty({
        id: 'number-prop-id',
        label: 'Numeric Label',
        name: 'numeric_label',
        template: TEMPLATE_ID,
      }),
      new SelectProperty({
        id: 'select-prop-id',
        label: 'Select Label',
        name: 'select_label',
        template: TEMPLATE_ID,
        content: 'thesauri-id',
      }),
    ])
    .build();

describe('CsvHeaderAnalyzer', () => {
  describe('successful analysis', () => {
    it('should return sanitized headers and languages for supported properties', () => {
      const template = buildTemplate();
      const headers = [
        'Title__es',
        'title__en',
        'Text Label__es',
        'text_label__en',
        'Select Label__en',
        'select_label__es',
        'numeric_label',
        'attachments',
        'file__es',
        'file__en',
      ];

      const analysis = CsvHeaderAnalyzer.analyze(headers, template, {
        availableLanguages: AVAILABLE_LANGUAGES,
        defaultLanguage: DEFAULT_LANGUAGE,
        newNameGeneration: false,
      });

      expect(analysis.headersWithoutLanguage).toEqual(
        expect.arrayContaining(['numeric_label', 'attachments'])
      );
      expect(Array.from(analysis.languagesPerHeader.title ?? [])).toEqual(
        expect.arrayContaining(['en', 'es'])
      );
      expect(Array.from(analysis.languagesPerHeader.text_label ?? [])).toEqual(
        expect.arrayContaining(['en', 'es'])
      );
      expect(Array.from(analysis.languagesPerHeader.select_label ?? [])).toEqual(
        expect.arrayContaining(['en', 'es'])
      );
      expect(Array.from(analysis.languagesPerHeader.file ?? [])).toEqual(
        expect.arrayContaining(['en', 'es'])
      );
    });

    it('should sanitize headers using PropertyName rules with new name generation', () => {
      const template = buildTemplate();
      const headers = ['Complex+Prop__es', 'Complex+Prop__en'];

      expect(() =>
        CsvHeaderAnalyzer.analyze(headers, template, {
          availableLanguages: AVAILABLE_LANGUAGES,
          defaultLanguage: DEFAULT_LANGUAGE,
          newNameGeneration: false,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        '"Column \\"complex_prop\\" does not exist in template \\"Template Name\\"."'
      );

      const analysis = CsvHeaderAnalyzer.analyze(headers, template, {
        availableLanguages: AVAILABLE_LANGUAGES,
        defaultLanguage: DEFAULT_LANGUAGE,
        newNameGeneration: true,
      });

      expect(Array.from(analysis.languagesPerHeader['complex+prop'] ?? [])).toEqual(
        expect.arrayContaining(['en', 'es'])
      );
    });
  });

  describe('error scenarios', () => {
    it('should throw when a property mixes language and non-language columns', () => {
      const template = buildTemplate();
      const headers = ['text_label', 'text_label__es', 'text_label__en'];

      expect(() =>
        CsvHeaderAnalyzer.analyze(headers, template, {
          availableLanguages: AVAILABLE_LANGUAGES,
          defaultLanguage: DEFAULT_LANGUAGE,
          newNameGeneration: false,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        '"Properties \\"text_label\\" mix language and non-language columns. Make sure to only use either suffixed or non-suffixed columns for each property."'
      );
    });

    it('should throw when a property that does not support languages uses suffixed columns', () => {
      const template = buildTemplate();
      const headers = ['numeric_label__es', 'numeric_label__en'];

      expect(() =>
        CsvHeaderAnalyzer.analyze(headers, template, {
          availableLanguages: AVAILABLE_LANGUAGES,
          defaultLanguage: DEFAULT_LANGUAGE,
          newNameGeneration: false,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        '"Property \\"numeric_label\\" does not support languages. Remove the language suffix from the column name."'
      );
    });

    it('should throw when a property with languages is missing the default language column', () => {
      const template = buildTemplate();
      const headers = ['text_label__es'];

      expect(() =>
        CsvHeaderAnalyzer.analyze(headers, template, {
          availableLanguages: AVAILABLE_LANGUAGES,
          defaultLanguage: DEFAULT_LANGUAGE,
          newNameGeneration: false,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        '"Property \\"text_label\\" uses languages, but does not have the default language column."'
      );
    });

    it('should throw when a language column does not belong to the template', () => {
      const template = buildTemplate();
      const headers = ['unknown_field__es', 'unknown_field__en'];

      expect(() =>
        CsvHeaderAnalyzer.analyze(headers, template, {
          availableLanguages: AVAILABLE_LANGUAGES,
          defaultLanguage: DEFAULT_LANGUAGE,
          newNameGeneration: false,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        '"Column \\"unknown_field\\" does not exist in template \\"Template Name\\"."'
      );
    });
  });
});
