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
  processGeolocationField,
  processHeaders,
  translateCommonHeaders,
} from '../csvExporter';
import { csvExample, searchResults, templates as testTemplates } from './exportCsvFixtures';
import * as formatters from '../typeFormatters';

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
  });

  describe('headers', () => {
    it('processHeaders should return the de-duplicated union of the templates properties', () => {
      const headers: ExportHeader[] = processHeaders(testTemplates);
      const headersLabels = headers.map((header: ExportHeader) => header.label);

      expect(headersLabels).toEqual([
        'company',
        'Nemesis',
        'Country',
        'Costume',
        'Super powers',
        'Allies',
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
          label: 'Geolocation',
          name: 'geolocation',
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
    });
  });

  describe('geolocation fields', () => {
    it('should locate the first geolocation field', () => {
      const formatted = processGeolocationField(
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd']
      );

      expect(formatted).toBe('45.974236866039696|2.154785156250431');
    });

    it('should return empty if no geolocation field on the template', () => {
      const formatted = processGeolocationField(
        searchResults.rows[1],
        testTemplates['58ad7d240d44252fee4e61fb']
      );

      expect(formatted).toBe('');
    });

    it('should return empty and not call the formatter if no geolocation on the entity', () => {
      const geolocationFieldBackup = searchResults.rows[0].metadata.geolocation_geolocation;
      delete searchResults.rows[0].metadata.geolocation_geolocation;

      const formatted = processGeolocationField(
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd']
      );

      searchResults.rows[0].metadata.geolocation_geolocation = geolocationFieldBackup;

      expect(formatted).toBe('');
    });
  });

  describe('common fields', () => {
    it('should return the title', () => {
      const formatted = processCommonField(
        'title',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );
      expect(formatted).toBe(searchResults.rows[0].title);
    });

    it('should return the template name', () => {
      const formatted = processCommonField(
        'template',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
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
            options
          );
          expect(creationDate).toBe(expectedDate);
          moment.tz.setDefault();
        }
      );
    });

    it('should return the geolocation field processed', () => {
      spyOn(formatters.formatters, 'geolocation').and.returnValue('geolocationValue');
      const formatted = processCommonField(
        'geolocation',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );
      expect(formatted).toBe('geolocationValue');
      expect(formatters.formatters.geolocation).toHaveBeenCalledWith(
        searchResults.rows[0].metadata.geolocation_geolocation,
        {}
      );
    });

    it('should return the documents field processed', () => {
      spyOn(formatters, 'formatDocuments').and.returnValue('documentsValue');
      const formatted = processCommonField(
        'documents',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );

      expect(formatters.formatDocuments).toHaveBeenCalledWith(searchResults.rows[0]);
      expect(formatted).toBe('documentsValue');
    });

    it('should return the attachments field processed', () => {
      spyOn(formatters, 'formatAttachments').and.returnValue('attachmentsValue');
      const formatted = processCommonField(
        'attachments',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );

      expect(formatters.formatAttachments).toHaveBeenCalledWith(searchResults.rows[0]);
      expect(formatted).toBe('attachmentsValue');
    });

    it('should return the published field processed', () => {
      let formatted = processCommonField(
        'published',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );
      expect(formatted).toBe('Published');

      const unpublishedEntity = { ...searchResults.rows[0] };
      unpublishedEntity.published = false;

      formatted = processCommonField(
        'published',
        unpublishedEntity,
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );
      expect(formatted).toBe('Unpublished');
    });

    it('should return empty if unsupported common field', () => {
      const formatted = processCommonField(
        'unsupported',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
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
        processEntity(nonTemplateEntity, [], testTemplates, options);
      }).toThrow();
    });

    it('it should format a common field and return an array', () => {
      const headers: ExportHeader[] = [
        {
          common: true,
          name: 'title',
          label: 'Title',
        },
      ];

      const formatted = processEntity(searchResults.rows[0], headers, testTemplates, options);

      expect(Array.isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(1);
      expect(formatted).toContain(searchResults.rows[0].title);
    });

    it("it should not fail and return empty if the entity doesn't define the property", () => {
      const headers: ExportHeader[] = [
        {
          common: false,
          name: 'nonDefinedProperty',
          label: 'Non-Defined property',
        },
      ];

      const formatted = processEntity(searchResults.rows[0], headers, testTemplates, options);

      expect(Array.isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(1);
      expect(formatted).toContain('');
    });

    it("it should not fail and return empty if the template doesn't define the property", () => {
      const headers: ExportHeader[] = [
        {
          common: false,
          name: 'company',
          label: 'Company',
        },
      ];

      const propertyBackup = testTemplates['58ad7d240d44252fee4e61fd'].properties.shift();
      const formatted = processEntity(searchResults.rows[0], headers, testTemplates, options);
      testTemplates['58ad7d240d44252fee4e61fd'].properties.unshift(propertyBackup);

      expect(Array.isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(1);
      expect(formatted).toContain('');
    });

    it('it should call the formatter and return the formatted properties ordered array', () => {
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

      const formatted = processEntity(searchResults.rows[0], headers, testTemplates, options);

      expect(Array.isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(2);
      expect(formatted[0]).toContain(searchResults.rows[0].metadata.company[0].value);
      expect(formatted[1]).toContain(searchResults.rows[0].metadata.nemesis[0].label);
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

      const formatted = processEntity(searchResults.rows[0], headers, testTemplates, options);

      testTemplates['58ad7d240d44252fee4e61fd'].properties[0].type = typeBackup;

      expect(Array.isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(2);
      expect(formatted[0]).toContain('');
      expect(formatted[1]).toContain(searchResults.rows[0].metadata.nemesis[0].label);
    });
  });

  describe('CSVExport class', () => {
    beforeEach(() => {
      spyOn(translations, 'get').and.callFake(async () => Promise.resolve());
      spyOn(translate, 'getLocaleTranslation').and.returnValue({});
      spyOn(translate, 'getContext').and.returnValue({});
      jest.spyOn(translate, 'default').mockImplementation((_context, _key, text) => text);
    });

    it('should be instantiable', () => {
      const instance = new CSVExporter();
      expect(instance).toBeInstanceOf(CSVExporter);
    });

    it('should export a correct csv content', done => {
      const writeMock = new ObjectWritableMock();
      const exporter = new CSVExporter();
      exporter
        .export(searchResults, writeMock, [])
        .then(() => {
          const exported = writeMock.data.reduce((chunk, memo) => chunk.toString() + memo, '');
          expect(exported).toEqual(csvExample);
          done();
        })
        .catch(err => {
          throw err;
        });
    });
  });
});
