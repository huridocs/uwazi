import { ObjectWritableMock } from 'stream-mock';
import templates from 'api/templates';
import translations from 'api/i18n/translations';
import * as translate from 'shared/translate';
import moment from 'moment-timezone';
import CSVExporter, {
  concatCommonHeaders,
  ExporterOptions,
  ExportHeader,
  getTemplatesModels,
  getTypes,
  prependCommonHeaders,
  processCommonField,
  processEntity,
  processHeaders,
  translateCommonHeaders,
} from '../csvExporter';
import { csvExample, searchResults, templates as testTemplates } from './exportCsvFixtures';

const hostname = 'cejil.uwazi.io';

describe('csvExporter', () => {
  describe('getTypes', () => {
    it('should return the whitelist if provided', () => {
      const typesWhitelist = ['5a85a699cf8f4ac95570ae59', '5a848088c464318833d9b542'];

      const types = getTypes(searchResults, typesWhitelist);

      expect(types).toBe(typesWhitelist);
    });
    it('should deduce the filtered types from the aggregations', () => {
      const types = getTypes(searchResults);

      ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb'].forEach(entry => {
        expect(types).toContain(entry);
      });
      expect(types.length).toBe(2);
    });
  });

  describe('getTemplateModels', () => {
    beforeAll(() => {
      jest
        .spyOn(templates, 'getById')
        .mockImplementation(async id =>
          Promise.resolve(id === 'notValid' ? null : testTemplates[id.toString()])
        );
    });
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch all the templates and return a map', async () => {
      const types = ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb'];

      const models = await getTemplatesModels(types);

      types.forEach(type => {
        expect(templates.getById).toHaveBeenCalledWith(type);
      });
      expect(templates.getById).toHaveBeenCalledTimes(2);
      expect(models).toEqual(testTemplates);
    });

    it('should not include a missing template', async () => {
      const types = ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb', 'notValid'];

      const models = await getTemplatesModels(types);

      types.forEach(type => {
        expect(templates.getById).toHaveBeenCalledWith(type);
      });
      expect(templates.getById).toHaveBeenCalledTimes(3);
      expect(models).toEqual(testTemplates);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });
  });

  describe('headers', () => {
    it('processHeaders should return the de-duplicated union of the templates properties', () => {
      const headers: ExportHeader[] = processHeaders(testTemplates);
      const headersLabels = headers.map((header: ExportHeader) => header.label);

      expect(headersLabels).toEqual([
        'company',
        'Nemesis',
        'Location',
        'Country',
        'Costume',
        'Super powers',
        'Allies',
        'Geolocation',
        'AutoId',
        'Sidekick',
        'Planets conquered',
        'DOB',
      ]);
    });

    it('prependCommonHeaders should add entries tagged with common at the beginning', () => {
      const prepended = prependCommonHeaders([
        {
          name: 'someName',
          label: 'someLabel',
          common: false,
        },
      ]);

      expect(prepended).toEqual([
        {
          common: true,
          label: 'Title',
          name: 'title',
        },
        {
          common: true,
          label: 'Date added',
          name: 'creationDate',
        },
        {
          common: true,
          label: 'Template',
          name: 'template',
        },
        {
          common: false,
          label: 'someLabel',
          name: 'someName',
        },
      ]);
    });

    it('concatCommonHeaders should add entries tagged with common at the end', () => {
      const appended = concatCommonHeaders([
        {
          name: 'someName',
          label: 'someLabel',
          common: false,
        },
      ]);

      expect(appended).toEqual([
        {
          common: false,
          label: 'someLabel',
          name: 'someName',
        },
        {
          common: true,
          label: 'Documents',
          name: 'documents',
        },
        {
          common: true,
          label: 'Attachments',
          name: 'attachments',
        },
        {
          common: true,
          label: 'Published',
          name: 'published',
        },
      ]);
    });

    it('should translate only the common headers', async () => {
      jest.spyOn(translations, 'get').mockResolvedValue([]);
      const localeTranslationsMock = jest
        .spyOn(translate, 'getLocaleTranslation')
        .mockReturnValue({});
      jest.spyOn(translate, 'getContext').mockReturnValue({});
      const translateMock = jest
        .spyOn(translate, 'default')
        .mockImplementation((_context, _key, text) => `${text}T`);

      const headers: ExportHeader[] = [
        {
          name: 'header1',
          label: 'Header1',
          common: false,
        },
        {
          name: 'header2',
          label: 'Header2',
          common: true,
        },
      ];

      const translatedHeaders = await translateCommonHeaders(headers, 'es');

      expect(translatedHeaders[0].label).toBe(headers[0].label);
      expect(translatedHeaders[1].label).toBe(`${headers[1].label}T`);
      expect(localeTranslationsMock).toHaveBeenCalledWith([], 'es');
      expect(translateMock).toHaveBeenCalledWith({}, headers[1].label, headers[1].label);

      jest.restoreAllMocks();
    });
  });

  describe('common fields', () => {
    it('should return the title', () => {
      const formatted = processCommonField(
        'title',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );
      expect(formatted).toBe(searchResults.rows[0].title);
    });

    it('should return the template name', () => {
      const formatted = processCommonField(
        'template',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );

      expect(formatted).toBe(testTemplates['58ad7d240d44252fee4e61fd'].name);
    });

    describe('creationDate', () => {
      it.each([
        { timezone: 'Europe/Madrid', timestamp: 0, expectedDate: '1970-01-01' },
        { timezone: 'Pacific/Honolulu', timestamp: 0, expectedDate: '1969-12-31' },
      ])(
        'should be formated using local time %p',
        async ({ timezone, timestamp, expectedDate }) => {
          const options = {};
          moment.tz.setDefault(timezone);

          const creationDate = processCommonField(
            'creationDate',
            { ...searchResults.rows[0], creationDate: timestamp },
            testTemplates['58ad7d240d44252fee4e61fd'],
            hostname,
            options
          );

          expect(creationDate).toBe(expectedDate);
          moment.tz.setDefault();
        }
      );
    });

    it('should return the documents field processed', () => {
      const formatted = processCommonField(
        'documents',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );

      expect(formatted).toBe('/files/1483623310306rxeimbblc6u323xr.pdf');
    });

    it('should return the attachments field processed', () => {
      const formatted = processCommonField(
        'attachments',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );

      expect(formatted).toBe('https://cejil.uwazi.io/api/files/16636666131855z23xqq4fd8.csv');
    });

    it('should return the published field processed', () => {
      let formatted = processCommonField(
        'published',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );

      expect(formatted).toBe('Published');

      const unpublishedEntity = { ...searchResults.rows[0] };
      unpublishedEntity.published = false;

      formatted = processCommonField(
        'published',
        unpublishedEntity,
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );

      expect(formatted).toBe('Unpublished');
    });

    it('should return empty if unsupported common field', () => {
      const formatted = processCommonField(
        'unsupported',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        hostname,
        {}
      );

      expect(formatted).toBe('');
    });
  });

  describe('processEntity', () => {
    const options: ExporterOptions = {
      dateFormat: 'YYYY-MM-DD',
      language: 'en',
    };

    it("should throw an error if could not find entity's template", () => {
      const nonTemplateEntity = { ...searchResults.rows[0] };
      nonTemplateEntity.template = 'invalidTemplate';

      expect(() => {
        processEntity(nonTemplateEntity, [], testTemplates, hostname, options);
      }).toThrow();
    });

    it('should format a common field and return an array', () => {
      const headers: ExportHeader[] = [
        {
          common: true,
          name: 'title',
          label: 'Title',
        },
      ];

      const formatted = processEntity(
        searchResults.rows[0],
        headers,
        testTemplates,
        hostname,
        options
      );

      expect(formatted).toEqual(['Star Lord  Wikipedia']);
    });

    it("should return empty if the entity doesn't define the property", () => {
      const headers: ExportHeader[] = [
        {
          common: false,
          name: 'nonDefinedProperty',
          label: 'Non-Defined property',
        },
      ];

      const formatted = processEntity(
        searchResults.rows[0],
        headers,
        testTemplates,
        hostname,
        options
      );

      expect(formatted).toEqual(['']);
    });

    it("it should return empty if the template doesn't define the property", () => {
      const headers: ExportHeader[] = [
        {
          common: false,
          name: 'company',
          label: 'Company',
        },
      ];

      const propertyBackup = testTemplates['58ad7d240d44252fee4e61fd'].properties.shift();
      const formatted = processEntity(
        searchResults.rows[0],
        headers,
        testTemplates,
        hostname,
        options
      );
      testTemplates['58ad7d240d44252fee4e61fd'].properties.unshift(propertyBackup);

      expect(formatted).toEqual(['']);
    });

    it('it should return the formatted properties ordered array', () => {
      const headers: ExportHeader[] = [
        {
          common: false,
          name: 'company',
          label: 'Company',
        },
        {
          common: false,
          name: 'nemesis',
          label: 'Nemesis',
        },
      ];

      const formatted = processEntity(
        searchResults.rows[0],
        headers,
        testTemplates,
        hostname,
        options
      );

      expect(formatted).toEqual(['Marvel', 'Thanos']);
    });

    it('it should not format non supported property types', () => {
      const headers: ExportHeader[] = [
        {
          common: false,
          name: 'company',
          label: 'Company',
        },
        {
          common: false,
          name: 'nemesis',
          label: 'Nemesis',
        },
      ];

      const typeBackup = testTemplates['58ad7d240d44252fee4e61fd'].properties[0].type;
      testTemplates['58ad7d240d44252fee4e61fd'].properties[0].type = 'nested';

      const formatted = processEntity(
        searchResults.rows[0],
        headers,
        testTemplates,
        hostname,
        options
      );

      testTemplates['58ad7d240d44252fee4e61fd'].properties[0].type = typeBackup;

      expect(formatted).toEqual(['', 'Thanos']);
    });
  });

  describe('CSVExport class', () => {
    beforeEach(() => {
      jest
        .spyOn(templates, 'getById')
        .mockImplementation(async id =>
          Promise.resolve(id === 'notValid' ? null : testTemplates[id.toString()])
        );
      jest.spyOn(translations, 'get').mockResolvedValue([]);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should export a correct csv content', async () => {
      const writeMock = new ObjectWritableMock();
      const exporter = new CSVExporter();

      await exporter.export(searchResults, writeMock, hostname, []);

      const exported = writeMock.data.reduce((chunk, memo) => chunk.toString() + memo, '');
      expect(exported).toEqual(csvExample);
    });
  });
});
