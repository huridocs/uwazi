import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import thesauri from 'api/thesauri';
import translations from 'api/i18n/translations';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { WithId } from 'api/odm';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { templateUtils } from 'api/templates';

import { arrangeThesauri, ArrangeThesauriError } from '../arrangeThesauri';

const fixtureFactory = getFixturesFactory();

// Create simplified fixtures for testing
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

// Simple mock for ImportFile
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
    
    // Setup languages
    await translations.addLanguage('es');
    
    // Get the template from fixtures
    template = fixtures.templates[0] as TemplateSchema;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('basic functionality', () => {
    it('should add new simple values to select thesaurus', async () => {
      const csvData = 'title,select_property__en,select_property__es\nentity1,New Value,New Value ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'select_property': new Set(['en', 'es']),
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
      expect(updatedThesaurus!.values).toHaveLength(3); // Original 2 + 1 new
      expect(updatedThesaurus!.values!.map(v => v.label)).toContain('New Value');
    });

    it('should add new parent-child values', async () => {
      const csvData = 'title,select_property__en,select_property__es\nentity1,New Parent::New Child,New Parent ES::New Child ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'select_property': new Set(['en', 'es']),
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
      const csvData = 'title,select_property__en,select_property__es\nentity1,Existing Value,Existing Value ES\nentity2,Existing Value,Existing Value ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'select_property': new Set(['en', 'es']),
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
      const existingValueCount = updatedThesaurus!.values!.filter(v => v.label === 'Existing Value').length;
      expect(existingValueCount).toBe(1); // Should not duplicate
    });
  });

  describe('error handling', () => {
    it('should throw ArrangeThesauriError when trying to add standalone group label', async () => {
      const csvData = 'title,select_property__en,select_property__es\nentity1,Parent Group,Parent Group ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'select_property': new Set(['en', 'es']),
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
  });

  describe('translations', () => {
    it('should save translations for new values', async () => {
      const csvData = 'title,select_property__en,select_property__es\nentity1,New Value,New Value ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'select_property': new Set(['en', 'es']),
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
  });

  describe('multiselect handling', () => {
    it('should handle multiple values in single cell', async () => {
      const csvData = 'title,multi_select_property__en,multi_select_property__es\nentity1,Value1|Value2,Value1 ES|Value2 ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'multi_select_property': new Set(['en', 'es']),
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
      const csvData = 'title,select_property__en,select_property__es\nentity1,New Value,New Value ES';
      const file = createMockImportFile(csvData);
      
      const headersWithoutLanguage: string[] = [];
      const languagesPerHeader = {
        'select_property': new Set(['en', 'es']),
      };

      const result = await arrangeThesauri(
        file as any,
        template,
        false,
        headersWithoutLanguage,
        languagesPerHeader,
        'en'
      );

      // Should return mappings for all select/multiselect properties in the template
      expect(result).toHaveProperty('select_property');
      expect(result).toHaveProperty('multi_select_property');
      expect(result['select_property']).toBe(selectThesaurusId);
      expect(result['multi_select_property']).toBe(multiselectThesaurusId);
    });
  });
}); 