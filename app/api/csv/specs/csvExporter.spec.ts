import { ObjectWritableMock } from 'stream-mock';
import { isArray } from 'util';
import templates from 'api/templates';
import translations from 'api/i18n/translations';
import * as translate from 'shared/translate';
import CSVExporter, {
  getTypes,
  getTemplatesModels,
  ExportHeader,
  processHeaders,
  prependCommonHeaders,
  concatCommonHeaders,
  ExporterOptions,
  processGeolocationField,
  processCommonField,
  processEntity,
  translateCommonHeaders,
} from '../csvExporter';
import { templates as testTemplates, searchResults, csvExample } from './exportCsvFixtures';
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

    const doTest = (types: string[], calledTimes: number, done: () => any) => {
      getTemplatesModels(types)
        .then(models => {
          types.forEach(type => {
            expect(templates.getById).toHaveBeenCalledWith(type);
          });
          expect(templates.getById).toHaveBeenCalledTimes(calledTimes);
          expect(models).toEqual(testTemplates);
          done();
        })
        .catch(e => {
          throw e;
        });
    };

    it('should fetch all the templates and return a map', done => {
      jest
        .spyOn(templates, 'getById')
        .mockImplementation(async id => Promise.resolve(testTemplates[id.toString()]));
      const types = ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb'];

      doTest(types, 2, done);
    });

    it('should not include a missing template', done => {
      const types = ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb', 'notValid'];

      doTest(types, 3, done);
    });
  });

  describe('headers', () => {
    it('processHeaders hould return the de-duplicated union of the templates properties', () => {
      const headers: ExportHeader[] = processHeaders(testTemplates);
      const headersLabels = headers.map((header: ExportHeader) => header.label);

      [
        'company',
        'Nemesis',
        'Costume',
        'Super powers',
        'Allies',
        'Sidekick',
        'Planets conquered',
        'DOB',
      ].forEach(label => {
        expect(headersLabels).toContain(label);
      });

      expect(headers.length).toBe(8);
    });

    it('prependCommonHeaders should add entries tagged with common at the beginning', () => {
      const prepended = prependCommonHeaders([
        {
          name: 'someName',
          label: 'someLabel',
          common: false,
        },
      ]);

      prepended.slice(0, prepended.length - 1).forEach((header: ExportHeader) => {
        expect(header.common).toBe(true);
      });
    });

    it('concatCommonHeaders should add entries tagged with common at the end', () => {
      const prepended = concatCommonHeaders([
        {
          name: 'someName',
          label: 'someLabel',
          common: false,
        },
      ]);

      prepended.slice(1, prepended.length).forEach((header: ExportHeader) => {
        expect(header.common).toBe(true);
      });
    });

    it('should translate only the common headers', async () => {
      spyOn(translations, 'get').and.returnValue(Promise.resolve({}));
      const localeTranslationsMock = spyOn(translate, 'getLocaleTranslation').and.returnValue({});
      spyOn(translate, 'getContext').and.returnValue({});
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
      expect(localeTranslationsMock).toHaveBeenCalledWith({}, 'es');
      expect(translateMock).toHaveBeenCalledWith({}, headers[1].label, headers[1].label);
    });
  });

  describe('geolocation fields', () => {
    it('should locate the first geolocation field and call the formatter', () => {
      spyOn(formatters.default, 'geolocation').and.returnValue('geolocationValue');
      const formatted = processGeolocationField(
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd']
      );

      expect(formatters.default.geolocation).toHaveBeenCalledWith(
        searchResults.rows[0].metadata.geolocation_geolocation,
        {}
      );
      expect(formatted).toBe('geolocationValue');
    });

    it('should return empty and not call the formatter if no geolocation field on the template', () => {
      spyOn(formatters.default, 'geolocation').and.returnValue('geolocationValue');
      const formatted = processGeolocationField(
        searchResults.rows[1],
        testTemplates['58ad7d240d44252fee4e61fb']
      );

      expect(formatters.default.geolocation).not.toHaveBeenCalled();
      expect(formatted).toBe('');
    });

    it('should return empty and not call the formatter if no geolocation on the entity', () => {
      spyOn(formatters.default, 'geolocation').and.returnValue('geolocationValue');

      const geolocationFieldBackup = searchResults.rows[0].metadata.geolocation_geolocation;
      delete searchResults.rows[0].metadata.geolocation_geolocation;
      const formatted = processGeolocationField(
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd']
      );
      searchResults.rows[0].metadata.geolocation_geolocation = geolocationFieldBackup;

      expect(formatters.default.geolocation).not.toHaveBeenCalled();
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

    it('should return the creation date', () => {
      spyOn(formatters.default, 'creationDate').and.returnValue('creationDateValue');
      const options = {};
      const formatted = processCommonField(
        'creationDate',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        options
      );
      expect(formatted).toBe('creationDateValue');
      expect(formatters.default.creationDate).toHaveBeenCalledWith(searchResults.rows[0], options);
    });

    it('should return the geolocation field processed', () => {
      spyOn(formatters.default, 'geolocation').and.returnValue('geolocationValue');
      const formatted = processCommonField(
        'geolocation',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );
      expect(formatted).toBe('geolocationValue');
      expect(formatters.default.geolocation).toHaveBeenCalledWith(
        searchResults.rows[0].metadata.geolocation_geolocation,
        {}
      );
    });

    it('should return the documents field processed', () => {
      spyOn(formatters.default, 'documents').and.returnValue('documentsValue');
      const formatted = processCommonField(
        'documents',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );

      expect(formatters.default.documents).toHaveBeenCalledWith(
        searchResults.rows[0].documents,
        {}
      );
      expect(formatted).toBe('documentsValue');
    });

    it('should return the attachments field processed', () => {
      spyOn(formatters.default, 'attachments').and.returnValue('attachmentsValue');
      const formatted = processCommonField(
        'attachments',
        searchResults.rows[0],
        testTemplates['58ad7d240d44252fee4e61fd'],
        {}
      );

      expect(formatters.default.attachments).toHaveBeenCalledWith(
        searchResults.rows[0].attachments.map((att: any) => ({
          ...att,
          entityId: searchResults.rows[0].sharedId,
        })),
        {}
      );
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

      expect(isArray(formatted)).toBe(true);
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

      expect(isArray(formatted)).toBe(true);
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

      expect(isArray(formatted)).toBe(true);
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

      expect(isArray(formatted)).toBe(true);
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

      expect(isArray(formatted)).toBe(true);
      expect(formatted.length).toBe(2);
      expect(formatted[0]).toContain('');
      expect(formatted[1]).toContain(searchResults.rows[0].metadata.nemesis[0].label);
    });
  });

  describe('CSVExport class', () => {
    beforeEach(() => {
      spyOn(translations, 'get').and.returnValue(Promise.resolve());
      spyOn(translate, 'getLocaleTranslation').and.returnValue({});
      spyOn(translate, 'getContext').and.returnValue({});
      jest.spyOn(translate, 'default').mockImplementation((_context, _key, text) => text);
    });

    it('should be instantiable', () => {
      const instance = new CSVExporter();
      expect(instance).toBeInstanceOf(CSVExporter);
    });

    it('should export a correct csv content', async done => {
      const writeMock = new ObjectWritableMock();
      const exporter = new CSVExporter();
      exporter
        .export(searchResults, [], writeMock)
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
