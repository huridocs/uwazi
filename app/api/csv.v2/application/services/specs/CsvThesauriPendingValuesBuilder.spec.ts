import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { SelectProperty } from '#api/core/domain/template/select/SelectProperty.js';
import { MultiSelectProperty } from '#api/core/domain/template/select/MultiSelectProperty.js';
import { CsvHeaderAnalyzer } from '../CsvHeaderAnalyzer.js';
import { CsvThesauriPendingValuesBuilder } from '../CsvThesauriPendingValuesBuilder.js';
import { CsvImportRow } from '../../../domain/CsvImportRow.js';

const TEMPLATE_ID = 'template-id';
const IMPORT_ID = 'import-id';
const THESAURUS_ID = 'thesaurus-id';
const AVAILABLE_LANGUAGES = ['en', 'es'];
const DEFAULT_LANGUAGE = 'en';

const buildTemplate = (type: 'select' | 'multiselect' = 'select') => {
  const property =
    type === 'select'
      ? new SelectProperty({
          id: 'select-prop-id',
          label: 'Select Property',
          name: 'select_property',
          template: TEMPLATE_ID,
          content: THESAURUS_ID,
        })
      : new MultiSelectProperty({
          id: 'select-prop-id',
          label: 'Select Property',
          name: 'select_property',
          template: TEMPLATE_ID,
          content: THESAURUS_ID,
        });

  return TemplateBuilder.aTemplate({ id: TEMPLATE_ID }).withProperties([property]).build();
};

const analyzeHeaders = (
  template: ReturnType<typeof buildTemplate>,
  headers: string[],
  newNameGeneration = false
) =>
  CsvHeaderAnalyzer.analyze(headers, template, {
    availableLanguages: AVAILABLE_LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE,
    newNameGeneration,
  });

describe('CsvThesauriPendingValuesBuilder', () => {
  it('should build pending entries for select properties', () => {
    const headers = ['title', 'select_property__en'];
    const template = buildTemplate();
    const rows: CsvImportRow[] = [
      CsvImportRow.create({
        importId: IMPORT_ID,
        index: 0,
        headers,
        values: ['entity-1', 'Apple'],
      }),
    ];

    const { pendingValues, issues } = CsvThesauriPendingValuesBuilder.build({
      importId: IMPORT_ID,
      rows,
      template,
      headerAnalysis: analyzeHeaders(template, headers),
      defaultLanguage: DEFAULT_LANGUAGE,
      newNameGeneration: false,
    });

    expect(issues).toHaveLength(0);
    expect(pendingValues.entries).toHaveLength(1);
    const entry = pendingValues.entries[0];
    expect(entry.propertyName).toBe('select_property');
    expect(entry.roots).toHaveLength(1);
    expect(entry.roots[0]).toMatchObject({
      label: 'Apple',
      languages: { en: 'Apple' },
      children: [],
    });
  });

  it('should include child labels when parsing parent::child syntax', () => {
    const headers = ['title', 'select_property__en'];
    const template = buildTemplate();
    const rows: CsvImportRow[] = [
      CsvImportRow.create({
        importId: IMPORT_ID,
        index: 0,
        headers,
        values: ['entity-1', 'Fruits::Apple'],
      }),
    ];

    const { pendingValues } = CsvThesauriPendingValuesBuilder.build({
      importId: IMPORT_ID,
      rows,
      template,
      headerAnalysis: analyzeHeaders(template, headers),
      defaultLanguage: DEFAULT_LANGUAGE,
      newNameGeneration: false,
    });

    const entry = pendingValues.entries[0];
    expect(entry.roots[0].label).toBe('Fruits');
    expect(entry.roots[0].children).toEqual([expect.objectContaining({ label: 'Apple' })]);
  });

  it('should aggregate parse errors as issues', () => {
    const headers = ['title', 'select_property__en'];
    const template = buildTemplate();
    const rows: CsvImportRow[] = [
      CsvImportRow.create({
        importId: IMPORT_ID,
        index: 0,
        headers,
        values: ['entity-1', 'Invalid::'],
      }),
    ];

    const { issues } = CsvThesauriPendingValuesBuilder.build({
      importId: IMPORT_ID,
      rows,
      template,
      headerAnalysis: analyzeHeaders(template, headers),
      defaultLanguage: DEFAULT_LANGUAGE,
      newNameGeneration: false,
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      property: 'select_property',
      type: 'parse',
    });
  });

  it('should attach translations for additional language columns', () => {
    const headers = ['title', 'select_property__en', 'select_property__es'];
    const template = buildTemplate();
    const rows: CsvImportRow[] = [
      CsvImportRow.create({
        importId: IMPORT_ID,
        index: 0,
        headers,
        values: ['entity-1', 'Apple', 'Manzana'],
      }),
    ];

    const { pendingValues } = CsvThesauriPendingValuesBuilder.build({
      importId: IMPORT_ID,
      rows,
      template,
      headerAnalysis: analyzeHeaders(template, headers),
      defaultLanguage: DEFAULT_LANGUAGE,
      newNameGeneration: false,
    });

    const root = pendingValues.entries[0].roots[0];
    expect(root.languages).toEqual({ en: 'Apple', es: 'Manzana' });
  });

  it('should record translation cardinality mismatches as issues', () => {
    const headers = ['title', 'select_property__en', 'select_property__es'];
    const template = buildTemplate('multiselect');
    const rows: CsvImportRow[] = [
      CsvImportRow.create({
        importId: IMPORT_ID,
        index: 0,
        headers,
        values: ['entity-1', 'Apple|Orange', 'Manzana'],
      }),
    ];

    const { issues } = CsvThesauriPendingValuesBuilder.build({
      importId: IMPORT_ID,
      rows,
      template,
      headerAnalysis: analyzeHeaders(template, headers),
      defaultLanguage: DEFAULT_LANGUAGE,
      newNameGeneration: false,
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'select_property',
          type: 'translation',
        }),
      ])
    );
  });
});
