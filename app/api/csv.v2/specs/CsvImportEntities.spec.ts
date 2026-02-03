/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs/promises';
import path from 'path';

import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { CsvExtractUploadedZipJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvExtractUploadedZipJobHandler.js';
import { createUploadedInputFile } from '#api/core/infrastructure/files/specs/InputFileTestFactory.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { CsvImportEntities } from '../CsvImportEntities.js';
import { CSVImportEntitiesFactories } from '../infrastructure/factories/CSVImportEntitiesFactories.js';

class FakeCsvExtractUploadedZipJobDispatcher {
  public calls: Array<{ params: any; jobInfo?: any }> = [];

  async handleDispatch(
    heartbeat: () => Promise<void>,
    params: any,
    jobInfo?: { retryCount: number; maxRetries: number; namespace: string }
  ): Promise<void> {
    this.calls.push({ params, jobInfo });
    await heartbeat();
  }
}

describe('CsvImportEntities (integration)', () => {
  const createdImportIds: string[] = [];
  const createdTempDirs: string[] = [];
  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await testingEnvironment.setTenant(undefined, 'csvV2-register');
    await testingEnvironment.cleanupUploadPaths();
  });

  afterEach(async () => {
    const base = tenants.current().uploadedDocuments;
    // remove per-test csv-imports folders deterministically to avoid leftovers
    for (const id of createdImportIds.splice(0)) {
      await fs.rm(path.join(base, 'csv-imports', id), { recursive: true, force: true });
    }
    // remove local temporary upload dirs
    for (const dir of createdTempDirs.splice(0)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await testingEnvironment.cleanupUploadPaths();
    await testingEnvironment.tearDown();
  });

  const setUp = async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const idGenerator = IdGeneratorFactory.default();
    const fakeDispatcher = new FakeCsvExtractUploadedZipJobDispatcher();
    const registry = {
      [CsvExtractUploadedZipJobHandler.name]: async () => fakeDispatcher,
    };
    const jobsDispatcher = new SyncDispatcherForTests(registry);

    const useCase = new CsvImportEntities({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });

    return { useCase, csvImportsDS, pathManager, fakeDispatcher };
  };

  const setUpIntermediate = async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const idGenerator = IdGeneratorFactory.default();
    const fakeDispatcher = new FakeCsvExtractUploadedZipJobDispatcher();
    const registry = {
      [CsvExtractUploadedZipJobHandler.name]: async () => fakeDispatcher,
    };
    const jobsDispatcher = new SyncDispatcherForTests(registry);

    const useCase = new CsvImportEntities({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });

    return { useCase, csvImportsDS, pathManager, fakeDispatcher };
  };

  const uniqueSubdir = (base: string) =>
    path.join(__dirname, base, `${Date.now()}_${Math.random().toString(36).slice(2)}`);

  it('should persist as queued and dispatch job (intermediate state)', async () => {
    const { useCase, csvImportsDS, pathManager, fakeDispatcher } = await setUpIntermediate();

    const tmpDir = uniqueSubdir('uploads_intermediate');
    const uploadFilename = 'uploaded.csv';
    const csvContent = 'title\nqueued-only';
    const inputFile = await createUploadedInputFile({
      dir: tmpDir,
      filename: uploadFilename,
      contents: csvContent,
      mimetype: 'text/csv',
      originalname: 'my.csv',
    });
    createdTempDirs.push(tmpDir);

    const f = getFixturesFactory();
    const result = await useCase.execute({
      template: 'template-1',
      file: inputFile,
      userId: f.idString('uploader'),
    });
    createdImportIds.push(result.id);

    const persisted = (await csvImportsDS.getById(result.id)).getDataOrThrow();
    expect(persisted.status).toBe('queued');
    expect(persisted.storage?.path).toBe(`csv-imports/${result.id}/${uploadFilename}`);

    // Original file exists
    const originalPath = pathManager.createPath({
      type: 'customPath',
      destination: `csv-imports/${result.id}`,
      filename: uploadFilename,
    });
    await expect(fs.readFile(originalPath, 'utf8')).resolves.toBe(csvContent);

    // Extraction has NOT run; no extracted/import.csv yet
    const extractedPath = pathManager.createPath({
      type: 'customPath',
      destination: `csv-imports/${result.id}/extracted`,
      filename: 'import.csv',
    });
    await expect(fs.access(extractedPath)).rejects.toBeDefined();

    // But a dispatch was recorded with expected params
    expect(fakeDispatcher.calls).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({
          tenantName: tenants.current().name,
          userId: f.idString('uploader'),
          importId: result.id,
        }),
      }),
    ]);
  });

  it('should persist import, store original file, and dispatch extraction job (sync)', async () => {
    const { useCase, csvImportsDS, pathManager, fakeDispatcher } = await setUp();

    const tmpDir = uniqueSubdir('uploads');
    const uploadFilename = 'uploaded.csv';
    const csvContent = 'title\nhello';
    const inputFile = await createUploadedInputFile({
      dir: tmpDir,
      filename: uploadFilename,
      contents: csvContent,
      mimetype: 'text/csv',
      originalname: 'my.csv',
    });
    createdTempDirs.push(tmpDir);

    const f = getFixturesFactory();
    const result = await useCase.execute({
      template: 'template-1',
      file: inputFile,
      userId: f.idString('uploader'),
    });
    createdImportIds.push(result.id);

    // response shape
    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: 'queued',
        message: expect.any(String),
      })
    );

    const persisted = (await csvImportsDS.getById(result.id)).getDataOrThrow();
    expect(persisted).toBeDefined();
    expect(persisted).toEqual(
      expect.objectContaining({
        id: result.id,
        templateId: 'template-1',
        status: 'queued',
        file: expect.objectContaining({
          originalName: 'my.csv',
          mimeType: 'text/csv',
          size: Buffer.byteLength(csvContent, 'utf8'),
        }),
        storage: expect.objectContaining({
          path: `csv-imports/${result.id}/${uploadFilename}`,
        }),
      })
    );

    // Original file stored
    const originalPath = pathManager.createPath({
      type: 'customPath',
      destination: `csv-imports/${result.id}`,
      filename: uploadFilename,
    });
    await expect(fs.readFile(originalPath, 'utf8')).resolves.toBe(csvContent);

    // Dispatch for extraction job was recorded with expected params
    expect(fakeDispatcher.calls).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({
          tenantName: tenants.current().name,
          userId: f.idString('uploader'),
          importId: result.id,
        }),
      }),
    ]);
  });
});
