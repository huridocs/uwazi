import { isArray } from 'util';
import fs from 'fs';
import templates from 'api/templates';
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
} from '../csvExporter';
import { searchResults, csvExample } from './exportCsvFixtures';
import * as formatters from '../typeFormatters';

const testTemplates: any = {
  '58ad7d240d44252fee4e61fd': {
    _id: '58ad7d240d44252fee4e61fd',
    name: 'Comic character',
    properties: [
      {
        _id: '58ad7d240d44252fee4e6200',
        id: 'f6c30c8a-3013-471f-be8c-e639f6aeb031',
        name: 'company',
        type: 'text',
        label: 'company',
      },
      {
        _id: '58ad7d240d44252fee4e61ff',
        relationType: '5aae90e0bfbf88e5ae28b19e',
        id: '3780239a-f858-4df5-9dea-8ea4a59cfc9e',
        name: 'nemesis',
        content: '58ad7d240d44252fee4e61fb',
        type: 'relationship',
        label: 'Nemesis',
      },
      {
        _id: '5e3d19ccdeeb2652690a1258',
        label: 'Costume',
        type: 'select',
        content: '5e3d1853deeb2652690a0c10',
        showInCard: false,
        filter: false,
        name: 'costume',
        id: 'a5407e10-5148-4241-ad81-0c8fa78f1c43',
      },
      {
        _id: '58ad7d240d44252fee4e61fe',
        filter: true,
        id: '113d9a13-7fb9-447f-abf1-4075a9f8eb00',
        name: 'super_powers',
        content: '58ad7d240d44252fee4e6208',
        type: 'multiselect',
        label: 'Super powers',
      },
      {
        _id: '59859ad8ddb12b0ce6664927',
        relationType: '5a8480fac464318833d9b553',
        label: 'Allies',
        type: 'relationship',
        content: '58ad7d240d44252fee4e61fb',
        name: 'allies',
        id: 'c22326ac-6723-42b5-bb3e-de0fdcc2e2dc',
      },
      {
        nestedProperties: [],
        _id: '5e8f9509f16db8b791fec574',
        label: 'Geolocation',
        type: 'geolocation',
        name: 'geolocation_geolocation',
        id: 'e9b810a9-8f25-442f-b521-616f3f3bbcdd',
      },
    ],
  },
  '58ad7d240d44252fee4e61fb': {
    _id: '58ad7d240d44252fee4e61fb',
    name: 'Super Villian',
    properties: [
      {
        _id: '5e3d1880deeb2652690a1036',
        label: 'Costume',
        type: 'select',
        content: '5e3d1853deeb2652690a0c10',
        name: 'costume',
        id: '53d6bb4a-2819-47b5-95a3-9261da5e8a69',
      },
      {
        _id: '58ad7d240d44252fee4e61fc',
        id: '58dd46d2-b52c-4e80-a859-6f4fadabe4c0',
        name: 'super_powers',
        content: '58ad7d240d44252fee4e6208',
        type: 'multiselect',
        label: 'Super powers',
      },
      {
        _id: '594bc3b0bee8b3829aea937f',
        relationType: '5aae90e0bfbf88e5ae28b1a3',
        label: 'Sidekick',
        type: 'relationship',
        content: '58f0aed2e147e720856a0741',
        name: 'sidekick',
        id: '0c45e6dc-0081-463e-9300-c46d13b1dcd2',
      },
      {
        _id: '594bc3b0bee8b3829aea937e',
        label: 'Planets conquered',
        type: 'numeric',
        name: 'planets_conquered',
        id: '6ec2c27a-ec30-4d0f-a7da-217a57e40ef2',
      },
      {
        _id: '594bc3b0bee8b3829aea937d',
        label: 'DOB',
        type: 'date',
        name: 'dob',
        id: '87289f51-21fb-4ff6-bb8d-8b7d66d86526',
      },
    ],
  },
};

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
          Promise.resolve(id === 'notValid' ? null : testTemplates[id])
        );
    });
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should fetch all the templates and return a map', done => {
      jest
        .spyOn(templates, 'getById')
        .mockImplementation(async id => Promise.resolve(testTemplates[id]));
      const types = ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb'];

      getTemplatesModels(types)
        .then(models => {
          types.forEach(type => {
            expect(templates.getById).toHaveBeenCalledWith(type);
          });
          expect(templates.getById).toHaveBeenCalledTimes(2);
          expect(models).toEqual(testTemplates);
          done();
        })
        .catch(e => {
          throw e;
        });
    });

    it('should not include a missing template', done => {
      const types = ['58ad7d240d44252fee4e61fd', '58ad7d240d44252fee4e61fb', 'notValid'];
      getTemplatesModels(types)
        .then(models => {
          types.forEach(type => {
            expect(templates.getById).toHaveBeenCalledWith(type);
          });
          expect(templates.getById).toHaveBeenCalledTimes(3);
          expect(models).toEqual(testTemplates);
          done();
        })
        .catch(e => {
          throw e;
        });
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

    it("it should return empty if the entity doesn't define the property", () => {
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
  });

  describe('CSVExport class', () => {
    it('should be instantiable', () => {
      const instance = new CSVExporter();
      expect(instance).toBeInstanceOf(CSVExporter);
    });

    it('should export a correct csv content', done => {
      const testFileName = './test-export.csv';
      const writeStream = fs.createWriteStream(testFileName);
      const exporter = new CSVExporter();
      exporter
        .export(searchResults, [], writeStream)
        .then(() => {
          writeStream.end(() => {
            fs.readFile('./test-export.csv', 'utf-8', (err, data) => {
              if (err) throw err;
              expect(data).toBe(csvExample);
              fs.unlinkSync(testFileName);
              done();
            });
          });
        })
        .catch(err => {
          throw err;
        });
    });
  });
});
