/* eslint-disable max-statements */
import path from 'path';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db from 'api/utils/testing_db';
import thesauri from 'api/thesauri';
import settings from 'api/settings';
import translations from 'api/i18n/translations';
import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { DefaultCsvImportRowsDataSource } from 'app/api/csv.v2/database/csv_import_rows_defaults';
import { CsvReader } from 'app/api/csv.v2/application/CsvReader';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultCsvImportsDataSource } from '../../database/data_source_defaults';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../model/CsvImport';
import { CsvPreflightPreparationUseCase } from '../CsvPreflightPreparationUseCase';

const streamFromString = (data: string) =>
  (async function* () {
    yield Buffer.from(data, 'utf8');
  })();

const stageRows = async (tm: any, importId: string, csvData: string) => {
  const rowsDS = DefaultCsvImportRowsDataSource(tm);
  const { headers, rows } = CsvReader.parse(csvData);
  const staged = rows.map((values, index) => ({ importId, index, headers, values }));
  await rowsDS.insertMany(staged);
};

describe('CsvPreflightPreparationUseCase', () => {
  const selectThesaurusId = db.id().toString();
  const templateId = db.id().toString();
  const userId = db.id().toString();
  const importId = db.id().toString();

  const fixtures = {
    settings: [
      {
        _id: db.id(),
        site_name: 'Uwazi',
        languages: [
          { key: 'en', label: 'English', default: true },
          { key: 'es', label: 'Spanish' },
        ],
      },
    ],
    dictionaries: [
      {
        _id: db.id(selectThesaurusId),
        name: 'test_select_thesaurus',
        values: [],
      },
    ],
    templates: [
      {
        _id: db.id(templateId),
        name: 'Test Template',
        properties: [
          {
            type: propertyTypes.select,
            label: 'Select Property',
            name: 'select_property',
            content: selectThesaurusId,
          },
        ],
      } as unknown as TemplateSchema,
    ],
  };

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv_v2_preflight_thesauri.index');
    await translations.addLanguage('es');
    await settings.setDefaultLanguage('en' as any);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create missing thesauri values and update import status', async () => {
    // Arrange: create csv_import with storage path and templateId
    const tm = TransactionManagerFactory.default();
    const csvImportsDS = DefaultCsvImportsDataSource(tm);
    const csvImport: CsvImport = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id: importId,
        templateId,
        file: {
          originalName: 'original.csv',
          mimeType: 'text/csv',
          size: 10,
        },
        createdBy: userId,
      }),
      `csv-imports/${importId}/original.csv`
    );
    await csvImportsDS.insert(csvImport);

    await stageRows(
      tm,
      importId,
      'title,select_property__en,select_property__es\ne1,New Value,New Value ES'
    );

    // Act
    const useCase = new CsvPreflightPreparationUseCase({
      csvImportsDS,
      transactionManager: tm,
    });
    const result = await useCase.execute({ importId });

    // Assert import status
    expect(result).toMatchObject({ importId, status: 'preflight:thesauri:done' });
    const updated = await csvImportsDS.getById(importId);
    expect(updated?.status).toBe('preflight:thesauri:done');

    // Assert thesaurus updated
    const updatedThesaurus = await thesauri.getById(selectThesaurusId);
    const labels = (updatedThesaurus?.values || []).map((v: any) => v.label);
    expect(labels).toContain('New Value');

    // Translations update will be handled in a follow-up step in v2; not asserted here.
  }, 20000);

  it('should not duplicate existing values and should trim spaces', async () => {
    // Seed existing value
    const dict = await thesauri.getById(selectThesaurusId);
    await thesauri.save({ ...(dict as any), values: [{ label: 'Existing Value' }] });

    const tm = TransactionManagerFactory.default();
    const csvImportsDS = DefaultCsvImportsDataSource(tm);
    const anotherImportId = db.id().toString();
    const csvImport2: CsvImport = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id: anotherImportId,
        templateId,
        file: { originalName: 'orig.csv', mimeType: 'text/csv', size: 10 },
        createdBy: userId,
      }),
      `csv-imports/${anotherImportId}/original.csv`
    );
    await csvImportsDS.insert(csvImport2);
    // duplicates and trimming
    await stageRows(
      tm,
      anotherImportId,
      'title,select_property__en,select_property__es\ne1,Existing Value,Existing Value ES\ne2,  New Value With Spaces  ,  New Value With Spaces ES  '
    );

    const useCase = new CsvPreflightPreparationUseCase({
      csvImportsDS,
      transactionManager: tm,
    } as any);
    await useCase.execute({ importId: anotherImportId });

    const updatedThesaurus = await thesauri.getById(selectThesaurusId);
    const labels = (updatedThesaurus?.values || []).map((v: any) => v.label);
    // Should contain single 'Existing Value' and trimmed 'New Value With Spaces'
    expect(labels.filter((l: string) => l === 'Existing Value').length).toBe(1);
    expect(labels).toContain('New Value With Spaces');
    expect(labels).not.toContain('  New Value With Spaces  ');
  }, 20000);
});
