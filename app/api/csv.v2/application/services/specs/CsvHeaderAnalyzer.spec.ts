import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { SelectProperty } from '#api/core/domain/template/select/SelectProperty.js';
import { CsvHeaderAnalyzer } from '../CsvHeaderAnalyzer.js';
import { CsvHeaderAnalyzerError } from '../CsvHeaderAnalyzerError.js';

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
        label: 'Complex@Prop',
        name: 'complex@prop',
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

const expectAnalyzerError = (
  fn: () => void,
  assertions: (error: CsvHeaderAnalyzerError) => void
) => {
  expect(fn).toThrow(CsvHeaderAnalyzerError);
  try {
    fn();
  } catch (error) {
    assertions(error as CsvHeaderAnalyzerError);
  }
};

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
      const headers = ['Complex@Prop__es', 'Complex@Prop__en'];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                reason: 'UnknownProperty',
                property: 'complex_prop',
              }),
            ])
          );
        }
      );

      const analysis = CsvHeaderAnalyzer.analyze(headers, template, {
        availableLanguages: AVAILABLE_LANGUAGES,
        defaultLanguage: DEFAULT_LANGUAGE,
        newNameGeneration: true,
      });

      expect(Array.from(analysis.languagesPerHeader['complex@prop'] ?? [])).toEqual(
        expect.arrayContaining(['en', 'es'])
      );
    });
  });

  describe('error scenarios', () => {
    it('should throw when a property mixes language and non-language columns', () => {
      const template = buildTemplate();
      const headers = ['text_label', 'text_label__es', 'text_label__en'];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                reason: 'MixedLanguageColumns',
                columns: ['text_label'],
              }),
            ])
          );
        }
      );
    });

    it('should throw when a property that does not support languages uses suffixed columns', () => {
      const template = buildTemplate();
      const headers = ['numeric_label__es', 'numeric_label__en'];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                reason: 'UnsupportedLanguageColumn',
                property: 'numeric_label',
              }),
            ])
          );
        }
      );
    });

    it('should throw when a property with languages is missing the default language column', () => {
      const template = buildTemplate();
      const headers = ['text_label__es'];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                reason: 'MissingDefaultLanguage',
                property: 'text_label',
              }),
            ])
          );
        }
      );
    });

    it('should throw when a language column does not belong to the template', () => {
      const template = buildTemplate();
      const headers = ['unknown_field__es', 'unknown_field__en'];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                reason: 'UnknownProperty',
                property: 'unknown_field',
              }),
            ])
          );
        }
      );
    });

    it('should throw when files column uses language suffixes', () => {
      const template = buildTemplate();
      const headers = ['files__en', 'files__es'];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                reason: 'UnknownProperty',
                property: 'files',
              }),
            ])
          );
        }
      );
    });

    it('should collect multiple issues in a single error', () => {
      const template = buildTemplate();
      const headers = [
        'text_label',
        'text_label__es',
        'numeric_label__es',
        'numeric_label__en',
        'unknown_field__en',
        'another_unknown__en',
      ];

      expectAnalyzerError(
        () =>
          CsvHeaderAnalyzer.analyze(headers, template, {
            availableLanguages: AVAILABLE_LANGUAGES,
            defaultLanguage: DEFAULT_LANGUAGE,
            newNameGeneration: false,
          }),
        error => {
          expect(error.issues).toHaveLength(5);
          expect(error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ reason: 'MixedLanguageColumns' }),
              expect.objectContaining({ reason: 'UnsupportedLanguageColumn' }),
              expect.objectContaining({ reason: 'MissingDefaultLanguage' }),
              expect.objectContaining({ reason: 'UnknownProperty', property: 'unknown_field' }),
              expect.objectContaining({ reason: 'UnknownProperty', property: 'another_unknown' }),
            ])
          );
          expect(
            error.issues.filter(issue => issue.reason === 'UnknownProperty').length
          ).toBeGreaterThanOrEqual(2);
        }
      );
    });
  });
});
