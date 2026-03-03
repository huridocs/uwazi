import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CSVImportEntitiesFactories } from '../../../infrastructure/factories/CSVImportEntitiesFactories.js';
import { ListCsvImportEntitiesImportsUseCase } from '../ListCsvImportEntitiesImportsUseCase.js';
import { GetCsvImportEntitiesImportUseCase } from '../GetCsvImportEntitiesImportUseCase.js';

describe('CsvImportEntities imports read use cases (integration)', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await testingEnvironment.setTenant(undefined, 'csvV2-reads');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should list rows including status and original uploaded filename', async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportEntitiesImportsDS =
      CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const listUseCase = new ListCsvImportEntitiesImportsUseCase({ csvImportEntitiesImportsDS });
    const f = getFixturesFactory();

    const one = CsvImportDomain.withStatus(
      CsvImportDomain.create({
        id: f.idString('list-one'),
        templateId: 'template-a',
        file: { originalName: 'first.csv', mimeType: 'text/csv', size: 11 },
        createdBy: f.idString('user-one'),
      }),
      CsvImportStatus.Queued
    );

    const two = CsvImportDomain.withStatus(
      CsvImportDomain.create({
        id: f.idString('list-two'),
        templateId: 'template-b',
        file: { originalName: 'second.zip', mimeType: 'application/zip', size: 22 },
        createdBy: f.idString('user-two'),
      }),
      CsvImportStatus.ExtractingFiles
    );

    await csvImportEntitiesImportsDS.insert(one);
    await csvImportEntitiesImportsDS.insert(two);

    const result = await listUseCase.execute();

    expect(result.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: one.id,
          status: CsvImportStatus.Queued,
          file: expect.objectContaining({ originalName: 'first.csv' }),
        }),
        expect.objectContaining({
          id: two.id,
          status: CsvImportStatus.ExtractingFiles,
          file: expect.objectContaining({ originalName: 'second.zip' }),
        }),
      ])
    );
  });

  it('should return the raw import object for details', async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportEntitiesImportsDS =
      CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const getUseCase = new GetCsvImportEntitiesImportUseCase({ csvImportEntitiesImportsDS });
    const f = getFixturesFactory();

    const csvImport = CsvImportDomain.withStatus(
      CsvImportDomain.withExtraction(
        CsvImportDomain.create({
          id: f.idString('detail-one'),
          templateId: 'template-detail',
          file: { originalName: 'detail.csv', mimeType: 'text/csv', size: 33 },
          createdBy: f.idString('user-detail'),
        }),
        {
          sourceType: 'csv',
          originalUploadSizeBytes: 33,
          extractedFilesCount: 1,
          files: [{ filename: 'detail.csv', sizeBytes: 33 }],
        }
      ),
      CsvImportStatus.ExtractingFilesDone
    );

    await csvImportEntitiesImportsDS.insert(csvImport);

    const result = await getUseCase.execute({ id: csvImport.id });

    expect(result).toEqual(
      expect.objectContaining({
        id: csvImport.id,
        status: CsvImportStatus.ExtractingFilesDone,
        file: expect.objectContaining({ originalName: 'detail.csv' }),
        extraction: expect.objectContaining({
          sourceType: 'csv',
          originalUploadSizeBytes: 33,
          extractedFilesCount: 1,
        }),
      })
    );
  });
});
