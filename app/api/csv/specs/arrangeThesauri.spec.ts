/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db from 'api/utils/testing_db';
import thesauri from 'api/thesauri';
import { templateUtils } from 'api/templates';
import translations from 'api/i18n/translations';
import { TemplateSchema } from 'shared/types/templateType';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { propertyTypes } from 'shared/propertyTypes';

import { arrangeThesauri, ArrangeThesauriError } from '../arrangeThesauri';

const createTestFixtures = () => {
  const selectThesaurusId = db.id();
  const multiselectThesaurusId = db.id();
  const templateId = db.id();

  return {
    templates: [
      {
        _id: templateId,
        name: 'Test Template',
        properties: [
          {
            type: propertyTypes.select,
            label: 'Select Property',
            name: templateUtils.safeName('select_property'),
            content: selectThesaurusId.toString(),
          },
          {
            type: propertyTypes.multiselect,
            label: 'Multi Select Property',
            name: templateUtils.safeName('multi_select_property'),
            content: multiselectThesaurusId.toString(),
          },
        ],
      },
    ],
    dictionaries: [
      {
        _id: selectThesaurusId,
        name: 'test_select_thesaurus',
        values: [
          {
            label: 'Existing Value',
            id: db.id().toString(),
          },
          {
            label: 'Parent Group',
            id: db.id().toString(),
            values: [
              {
                label: 'Child 1',
                id: db.id().toString(),
              },
              {
                label: 'Child 2',
                id: db.id().toString(),
              },
            ],
          },
          // unsanitized values to test preservation
          {
            label: '  Unsanitized Value  ',
            id: db.id().toString(),
          },
          {
            label: '  Parent With Spaces  ',
            id: db.id().toString(),
            values: [
              {
                label: '  Child With Spaces  ',
                id: db.id().toString(),
              },
            ],
          },
        ],
      },
      {
        _id: multiselectThesaurusId,
        name: 'test_multiselect_thesaurus',
        values: [
          {
            label: 'Existing Multi Value',
            id: db.id().toString(),
          },
          // unsanitized multiselect value
          {
            label: '  Unsanitized Multi Value  ',
            id: db.id().toString(),
          },
        ],
      },
    ],
    settings: [
      {
        _id: db.id(),
        site_name: 'Uwazi',
        languages: [
          { key: 'en' as LanguageISO6391, label: 'English', default: true },
          { key: 'es' as LanguageISO6391, label: 'Spanish' },
        ],
      },
    ],
  };
};

const createMockImportFile = (content: string) => ({
  filePath: '/mock/file.csv',
  async readStream() {
    const { Readable } = require('stream');
    return Readable.from([content]) as any;
  },
  async checkFileExists() {
    // Mock implementation
  },
  async extractFile(fileName: string, existingGeneratedName?: string) {
    const generatedName = existingGeneratedName || `mock_${fileName}`;
    return {
      destination: '/tmp',
      path: `/tmp/${generatedName}`,
      originalname: fileName,
      filename: generatedName,
      mimetype: 'text/csv',
    };
  },
});

describe('arrangeThesauri', () => {
  let template: TemplateSchema;
  let selectThesaurusId: string;
  let multiselectThesaurusId: string;

  beforeAll(async () => {
    const fixtures = createTestFixtures();
    selectThesaurusId = fixtures.dictionaries[0]._id.toString();
    multiselectThesaurusId = fixtures.dictionaries[1]._id.toString();

    await testingEnvironment.setUp(fixtures as any, 'arrange_thesauri_test.index');

    await translations.addLanguage('es');

    template = fixtures.templates[0] as TemplateSchema;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('basic functionality', () => {
    it('should add new simple values to select thesaurus', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,New Value,New Value ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      expect(updatedThesaurus!.values).toHaveLength(5); // Original 4 + 1 new
      expect(updatedThesaurus!.values!.map(v => v.label)).toContain('New Value');
    });

    it('should add new parent-child values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,New Parent::New Child,New Parent ES::New Child ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      const newParent = updatedThesaurus!.values!.find(v => v.label === 'New Parent');
      expect(newParent).toBeDefined();
      expect(newParent!.values).toHaveLength(1);
      expect(newParent!.values![0].label).toBe('New Child');
    });

    it('should not add duplicate values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,Existing Value,Existing Value ES\nentity2,Existing Value,Existing Value ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      const existingValueCount = updatedThesaurus!.values!.filter(
        v => v.label === 'Existing Value'
      ).length;
      expect(existingValueCount).toBe(1); // Should not duplicate
    });
  });

  describe('sanitization scenarios', () => {
    it('should sanitize new values with leading/trailing spaces', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,  New Value With Spaces  ,  New Value ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      // Should find the sanitized version (trimmed)
      const sanitizedValue = updatedThesaurus!.values!.find(
        v => v.label === 'New Value With Spaces'
      );
      expect(sanitizedValue).toBeDefined();
      // Should not have the unsanitized version
      const unsanitizedValue = updatedThesaurus!.values!.find(
        v => v.label === '  New Value With Spaces  '
      );
      expect(unsanitizedValue).toBeUndefined();
    });

    it('should sanitize new nested values with spaces', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,  Unique Parent With Spaces  ::  Unique Child With Spaces  ,  Unique Parent ES  ::  Unique Child ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);

      const newParent = updatedThesaurus!.values!.find(
        v => v.label === 'Unique Parent With Spaces'
      );
      expect(newParent).toBeDefined();
      expect(newParent!.values).toHaveLength(1);
      expect(newParent!.values![0].label).toBe('Unique Child With Spaces');

      // Should not have unsanitized versions
      const unsanitizedParent = updatedThesaurus!.values!.find(
        v => v.label === '  Unique Parent With Spaces  '
      );
      expect(unsanitizedParent).toBeUndefined();
    });

    it('should preserve existing unsanitized values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,  Unsanitized Value  ,  Unsanitized Value ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      // Should preserve the existing unsanitized value
      const existingUnsanitized = updatedThesaurus!.values!.find(
        v => v.label === '  Unsanitized Value  '
      );
      expect(existingUnsanitized).toBeDefined();
      // Should not create a new sanitized version
      const sanitizedVersion = updatedThesaurus!.values!.find(v => v.label === 'Unsanitized Value');
      expect(sanitizedVersion).toBeUndefined();
    });

    it('should preserve existing unsanitized nested values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,  Parent With Spaces  ::  Child With Spaces  ,  Parent ES  ::  Child ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      // Should preserve the existing unsanitized parent
      const existingUnsanitizedParent = updatedThesaurus!.values!.find(
        v => v.label === '  Parent With Spaces  '
      );
      expect(existingUnsanitizedParent).toBeDefined();
      expect(existingUnsanitizedParent!.values).toHaveLength(1);
      expect(existingUnsanitizedParent!.values![0].label).toBe('  Child With Spaces  ');
    });

    it('should handle case-insensitive matching for existing values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,EXISTING VALUE,EXISTING VALUE ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);
      // Should not create a new value since it matches existing (case-insensitive)
      const existingValueCount = updatedThesaurus!.values!.filter(
        v => v.label === 'Existing Value'
      ).length;
      expect(existingValueCount).toBe(1);
      // Should not create uppercase version
      const uppercaseVersion = updatedThesaurus!.values!.find(v => v.label === 'EXISTING VALUE');
      expect(uppercaseVersion).toBeUndefined();
    });

    it('should sanitize multiselect values with spaces', async () => {
      const csvData =
        'title,multi_select_property__en,multi_select_property__es\nentity1,  Value1  |  Value2  ,  Value1 ES  |  Value2 ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        multi_select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(multiselectThesaurusId);
      expect(updatedThesaurus!.values!.map(v => v.label)).toContain('Value1');
      expect(updatedThesaurus!.values!.map(v => v.label)).toContain('Value2');

      // Should not have unsanitized versions
      const unsanitizedValue1 = updatedThesaurus!.values!.find(v => v.label === '  Value1  ');
      const unsanitizedValue2 = updatedThesaurus!.values!.find(v => v.label === '  Value2  ');
      expect(unsanitizedValue1).toBeUndefined();
      expect(unsanitizedValue2).toBeUndefined();
    });

    it('should preserve existing unsanitized multiselect values', async () => {
      const csvData =
        'title,multi_select_property__en,multi_select_property__es\nentity1,  Unsanitized Multi Value  ,  Unsanitized Multi Value ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        multi_select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(multiselectThesaurusId);
      // Should preserve the existing unsanitized value
      const existingUnsanitized = updatedThesaurus!.values!.find(
        v => v.label === '  Unsanitized Multi Value  '
      );
      expect(existingUnsanitized).toBeDefined();
      // Should not create a new sanitized version
      const sanitizedVersion = updatedThesaurus!.values!.find(
        v => v.label === 'Unsanitized Multi Value'
      );
      expect(sanitizedVersion).toBeUndefined();
    });

    it('should handle mixed sanitized and unsanitized values in same CSV', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,  New Sanitized Value  ,  New Sanitized Value ES  \nentity2,  Unsanitized Value  ,  Unsanitized Value ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(selectThesaurusId);

      // Should add new sanitized value
      const newSanitized = updatedThesaurus!.values!.find(v => v.label === 'New Sanitized Value');
      expect(newSanitized).toBeDefined();

      // Should preserve existing unsanitized value
      const existingUnsanitized = updatedThesaurus!.values!.find(
        v => v.label === '  Unsanitized Value  '
      );
      expect(existingUnsanitized).toBeDefined();

      // Should not create duplicate sanitized versions
      const sanitizedVersion = updatedThesaurus!.values!.find(v => v.label === 'Unsanitized Value');
      expect(sanitizedVersion).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw ArrangeThesauriError when trying to add standalone group label', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,Parent Group,Parent Group ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await expect(
        arrangeThesauri(
          file as any,
          template,
          false,
          headersWithoutLanguage,
          languagesPerHeader,
          'en'
        )
      ).rejects.toThrow(ArrangeThesauriError);
    });

    it('should not throw inside csv onError and instead throw after read', async () => {
      jest.resetModules();

      const csvModulePath = require.resolve('../csv');
      const thesauriModulePath = require.resolve('api/thesauri');
      const arrangeThesauriModulePath = require.resolve('../arrangeThesauri');

      const csvState = { onErrorThrew: false };

      jest.doMock(csvModulePath, () => {
        const csvMock = (_stream: any, _stopOnError?: boolean) => {
          const api: any = {
            // eslint-disable-next-line no-empty-function
            _onRow: async () => {},
            // eslint-disable-next-line no-empty-function
            _onError: async () => {},
            onRow(fn: any) {
              this._onRow = fn;
              return this;
            },
            onError(fn: any) {
              this._onError = fn;
              return this;
            },
            async read() {
              const row = { any: 'value' };
              const index = 0;
              try {
                await this._onError(new Error('simulated error'), row, index);
              } catch (_e) {
                csvState.onErrorThrew = true;
                // swallow to let test proceed and assert
              }
            },
          };
          return api;
        };

        return { __esModule: true, default: csvMock };
      });

      // avoid DB calls in setupProperties/saves
      jest.doMock(thesauriModulePath, () => ({
        __esModule: true,
        default: {
          get: jest.fn().mockResolvedValue([]),
          appendValues: jest.fn(),
          save: jest.fn(),
          getById: jest.fn(),
        },
      }));

      const {
        arrangeThesauri: arrangeThesauriImported,
        ArrangeThesauriError: ArrangeThesauriErrorImported,
      } = await import(arrangeThesauriModulePath);

      const file = createMockImportFile('title\nentity1');
      const minimalTemplate = { properties: [] } as any;

      await expect(
        arrangeThesauriImported(file as any, minimalTemplate, false, [], {}, 'en', true)
      ).rejects.toThrow(ArrangeThesauriErrorImported);

      // Key assertion: onError must NOT throw synchronously
      expect(csvState.onErrorThrew).toBe(false);
    });
  });

  describe('translations', () => {
    it('should save translations for new values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,New Value,New Value ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const allTranslations = await translations.get();
      const spanishTranslations = allTranslations.find(t => t.locale === 'es');
      expect(spanishTranslations).toBeDefined();

      const thesaurusContext = spanishTranslations?.contexts?.find(
        c => c.label === 'test_select_thesaurus'
      );
      expect(thesaurusContext).toBeDefined();
      expect(thesaurusContext!.values['New Value']).toBe('New Value ES');
    });

    it('should save translations for sanitized values', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,  Sanitized Value  ,  Sanitized Value ES  ';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const allTranslations = await translations.get();
      const spanishTranslations = allTranslations.find(t => t.locale === 'es');
      expect(spanishTranslations).toBeDefined();

      const thesaurusContext = spanishTranslations?.contexts?.find(
        c => c.label === 'test_select_thesaurus'
      );
      expect(thesaurusContext).toBeDefined();
      // Translation should be saved for the sanitized label
      expect(thesaurusContext!.values['Sanitized Value']).toBe('Sanitized Value ES');
    });
  });

  describe('multiselect handling', () => {
    it('should handle multiple values in single cell', async () => {
      const csvData =
        'title,multi_select_property__en,multi_select_property__es\nentity1,Value1|Value2,Value1 ES|Value2 ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        multi_select_property: new Set(['en', 'es']),
      };

      await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      const updatedThesaurus = await thesauri.getById(multiselectThesaurusId);
      expect(updatedThesaurus!.values!.map(v => v.label)).toContain('Value1');
      expect(updatedThesaurus!.values!.map(v => v.label)).toContain('Value2');
    });
  });

  describe('return value', () => {
    it('should return mapping of property names to thesaurus IDs', async () => {
      const csvData =
        'title,select_property__en,select_property__es\nentity1,New Value,New Value ES';
      const file = createMockImportFile(csvData);

      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        select_property: new Set(['en', 'es']),
      };

      const result = await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      expect(result).toHaveProperty('select_property');
      expect(result).toHaveProperty('multi_select_property');
      expect(result.select_property).toBe(selectThesaurusId);
      expect(result.multi_select_property).toBe(multiselectThesaurusId);
    });
  });
});
