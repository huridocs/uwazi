/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs/promises';
import path from 'path';

import { tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { CsvImportDomain, CsvImportStatus } from 'api/csv.v2/domain/CsvImport';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { createTestingZip } from 'api/csv/specs/helpers';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DiskFile } from 'api/core/infrastructure/files/DiskFile';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { CsvPreflightJobHandler } from 'api/csv.v2/infrastructure/jobHandlers/CsvPreflightJobHandler';
import { CsvImportDoesNotExistError } from 'api/csv.v2/domain/csvImporErrors';
import { TestUtils } from 'api/common.v2/utils/Test';
import { CsvExtractUploadedZipJobFactory } from 'api/csv.v2/infrastructure/factories/CsvExtractUploadedZipJobFactory';
import { Callbacks } from '../CsvExtractUploadedZipJob';

const callbacks: Callbacks = {
  onStart: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
  onProgress: jest.fn(),
};

describe('CsvExtractUploadedZipJob (integration)', () => {
  const createdImportIds: string[] = [];
  const createdTempDirs: string[] = [];
  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await testingEnvironment.setTenant(undefined, 'csvV2-extract');
    await testingEnvironment.cleanupUploadPaths();
  });

  afterEach(async () => {
    const base = tenants.current().uploadedDocuments;
    // eslint-disable-next-line no-restricted-syntax
    for (const id of createdImportIds.splice(0)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.rm(path.join(base, 'csv-imports', id), { recursive: true, force: true });
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const dir of createdTempDirs.splice(0)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await testingEnvironment.cleanupUploadPaths();
    await testingEnvironment.tearDown();
  });

  const setUp = (options?: { batchSize?: number }) => {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
      dispatch: jest.fn().mockResolvedValue(undefined),
      dispatchMany: jest.fn().mockResolvedValue(undefined),
    }) as jest.Mocked<JobsDispatcher>;
    const { useCase, csvImportsDS, rowsDS } = CsvExtractUploadedZipJobFactory.build({
      transactionManager,
      fileStorage,
      batchSize: options?.batchSize,
      jobsDispatcher,
    });
    return { useCase, csvImportsDS, rowsDS, pathManager, fileStorage, jobsDispatcher };
  };

  const buildInput = (importId: string, userId = 'u1') => ({
    importId,
    tenantName: tenants.current().name,
    userId,
    callbacks,
  });

  it('should normalize a single CSV to extracted/import.csv, stage rows, and set final status', async () => {
    const { useCase, csvImportsDS, rowsDS, pathManager, fileStorage, jobsDispatcher } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('csv-only');
    const userId = f.idString('uploader');

    // prepare original CSV in storage path
    const destination = `csv-imports/${id}`;
    const originalFilename = 'original.csv';
    const simpleCsvFixture = path.join(__dirname, '../../../specs/zipData/csv-v2-simple.csv');
    await fileStorage.storeContent(
      new DiskFile(simpleCsvFixture).toContent(),
      `${destination}/${originalFilename}`
    );

    // insert import doc (queued) with storage path
    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'orig', mimeType: 'text/csv', size: 10 },
        createdBy: userId,
      }),
      `${destination}/${originalFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await useCase.execute(buildInput(id, userId));
    createdImportIds.push(id);

    const updated = (await csvImportsDS.getById(id)).getDataOrThrow();
    expect(updated.status).toBe(CsvImportStatus.ExtractingFilesDone);
    expect(updated.failure ?? undefined).toBeUndefined();
    const extractedPath = pathManager.createPath({
      type: 'customPath',
      destination: `${destination}/extracted`,
      filename: 'import.csv',
    });
    await expect(fs.access(extractedPath)).resolves.toBeUndefined();
    const stagedRows = await rowsDS.getByImport(id);
    expect(stagedRows).toHaveLength(2);
    expect(stagedRows[0].headers).toEqual(['title', 'description']);
    expect(stagedRows[0].values).toEqual(['Doc 1', 'Value, With, Commas']);
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(CsvPreflightJobHandler, {
      tenantName: tenants.current().name,
      userId,
      importId: id,
    });
  });

  it('should stage empty CSV rows so indexes match the source file', async () => {
    const { useCase, csvImportsDS, rowsDS, fileStorage } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('csv-empty-rows');
    const userId = f.idString('uploader-empty');

    const destination = `csv-imports/${id}`;
    const originalFilename = 'original.csv';
    const emptyRowFixture = path.join(__dirname, '../../../specs/zipData/csv-v2-empty-row.csv');
    await fileStorage.storeContent(
      new DiskFile(emptyRowFixture).toContent(),
      `${destination}/${originalFilename}`
    );

    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'orig', mimeType: 'text/csv', size: 10 },
        createdBy: userId,
      }),
      `${destination}/${originalFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await useCase.execute(buildInput(id, userId));
    createdImportIds.push(id);

    const stagedRows = await rowsDS.getByImport(id);
    expect(stagedRows).toHaveLength(3);
    expect(stagedRows[1].values).toEqual(['', '']);
    expect(stagedRows[1].index).toBe(1);
  });

  it('should stage rows in batches for large CSVs', async () => {
    const { useCase, csvImportsDS, rowsDS, fileStorage } = setUp({ batchSize: 3 });
    const insertSpy = jest.spyOn(rowsDS, 'insertMany');
    const f = getFixturesFactory();
    const id = f.idString('csv-batch');
    const userId = f.idString('uploader-batch');

    const destination = `csv-imports/${id}`;
    const originalFilename = 'original.csv';
    const batchFixture = path.join(__dirname, '../../../specs/zipData/csv-v2-batch.csv');
    await fileStorage.storeContent(
      new DiskFile(batchFixture).toContent(),
      `${destination}/${originalFilename}`
    );

    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'orig', mimeType: 'text/csv', size: 10 },
        createdBy: userId,
      }),
      `${destination}/${originalFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await useCase.execute(buildInput(id, userId));
    createdImportIds.push(id);

    expect(insertSpy.mock.calls.length).toBeGreaterThan(1);
    const totalInserted = insertSpy.mock.calls.reduce((sum, [rows]) => sum + rows.length, 0);
    expect(totalInserted).toBe(9);
    insertSpy.mockRestore();
  });

  it('should extract a ZIP with root files, stage rows, and require import.csv', async () => {
    const { useCase, csvImportsDS, rowsDS, pathManager, fileStorage } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-happy');
    const userId = f.idString('uploader-zip');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload.zip';

    const tempZipDir = path.join(
      __dirname,
      'tmp',
      `${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(tempZipDir, { recursive: true });
    await fs.mkdir(path.join(tempZipDir, 'zipData'), { recursive: true });
    const csvPath = path.join(tempZipDir, 'zipData', 'import.csv');
    const extraFile = path.join(tempZipDir, 'zipData', '1.pdf');
    const csvContent = ['title,description', 'Zip Row 1,Zip Value 1', 'Zip Row 2,Zip Value 2'].join(
      '\n'
    );
    await fs.writeFile(csvPath, csvContent);
    await fs.writeFile(extraFile, 'pdf-placeholder');
    await createTestingZip([csvPath, extraFile], zipFilename, tempZipDir);
    createdTempDirs.push(tempZipDir);

    const zipPath = path.join(tempZipDir, 'zipData', zipFilename);
    await fileStorage.storeContent(
      new DiskFile(zipPath).toContent(),
      `${destination}/${zipFilename}`
    );
    const storedZipPath = pathManager.createPath({
      type: 'customPath',
      destination,
      filename: zipFilename,
    });
    await expect(fs.access(storedZipPath)).resolves.toBeUndefined();

    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
        createdBy: userId,
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await useCase.execute(buildInput(id, userId));
    createdImportIds.push(id);

    const updated = (await csvImportsDS.getById(id)).getDataOrThrow();
    expect(updated.status).toBe(CsvImportStatus.ExtractingFilesDone);
    expect(updated.failure ?? undefined).toBeUndefined();
    const extractedDir = pathManager.createPath({
      type: 'customPath',
      destination: `${destination}/extracted`,
      filename: '',
    });
    await expect(fs.access(path.join(extractedDir, 'import.csv'))).resolves.toBeUndefined();
    const stagedRows = await rowsDS.getByImport(id);
    expect(stagedRows).toHaveLength(2);
    expect(stagedRows[1].values).toEqual(['Zip Row 2', 'Zip Value 2']);
  });

  it('should throw when import not found (??? This originally was a NonRetryableJobError)', async () => {
    const { useCase } = setUp();
    const f = getFixturesFactory();
    await expect(useCase.execute(buildInput(f.idString('non-existent')))).rejects.toBeInstanceOf(
      CsvImportDoesNotExistError
    );
  });

  it('should throw NonRetryableJobError when storage path is missing', async () => {
    const { useCase, csvImportsDS } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('no-storage');
    const importDoc = CsvImportDomain.create({
      id,
      templateId: 't1',
      file: { originalName: 'orig', mimeType: 'text/csv', size: 10 },
      createdBy: 'u1',
    });
    await csvImportsDS.insert(importDoc);
    await expect(useCase.execute(buildInput(id))).rejects.toBeInstanceOf(NonRetryableJobError);
    const after = (await csvImportsDS.getById(id)).getDataOrThrow();
    expect(after.status).toBe(CsvImportStatus.ExtractingFiles);
  });

  it('should set failed when ZIP is missing import.csv', async () => {
    const { useCase, csvImportsDS, fileStorage } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-missing-import');
    const userId = f.idString('uploader-missing-zip');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload_no_import.zip';

    const zipDir = path.join(__dirname, '../../../specs/zipData');
    const tempZipDir = path.join(
      __dirname,
      'tmp',
      `${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(tempZipDir, { recursive: true });
    await fs.mkdir(path.join(tempZipDir, 'zipData'), { recursive: true });
    await createTestingZip([path.join(zipDir, 'test.csv')], zipFilename, tempZipDir);
    createdTempDirs.push(tempZipDir);

    const zipPath2 = path.join(tempZipDir, 'zipData', zipFilename);
    await fileStorage.storeContent(
      new DiskFile(zipPath2).toContent(),
      `${destination}/${zipFilename}`
    );

    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
        createdBy: userId,
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await expect(useCase.execute(buildInput(id, userId))).rejects.toBeInstanceOf(
      NonRetryableJobError
    );
    createdImportIds.push(id);
    const updated = (await csvImportsDS.getById(id)).getDataOrThrow();
    expect(updated.status).toBe(CsvImportStatus.Failed);
    expect(updated.failure).toEqual(
      expect.objectContaining({
        retryable: false,
        stage: 'extracting files',
        message: expect.any(String),
        at: expect.any(Number),
      })
    );
  });
});
