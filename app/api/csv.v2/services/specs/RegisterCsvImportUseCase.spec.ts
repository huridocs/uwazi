/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs/promises';
import path from 'path';

import { tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultCsvImportsDataSource } from 'api/csv.v2/database/data_source_defaults';
import { FileSystemStorage } from 'api/core/infrastructure/files/FileSystemStorage';
import { PathManager } from 'api/core/infrastructure/files/PathManager';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SyncDispatcherForTests } from 'api/core/libs/queue/infrastructure/SyncDispatcherForTests';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { CsvExtractUploadedZipJob } from 'api/csv.v2/jobs/CsvExtractUploadedZipJob';
import { CsvExtractUploadedZipUseCase } from 'api/csv.v2/services/CsvExtractUploadedZipUseCase';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { TestUtils } from 'api/common.v2/utils/Test';
import { createUploadedInputFile } from 'api/core/domain/files/specs/InputFileTestFactory';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { RegisterCsvImportUseCase } from '../RegisterCsvImportUseCase';

describe('RegisterCsvImportUseCase (integration)', () => {
  const createdImportIds: string[] = [];
  const createdTempDirs: string[] = [];
  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await testingEnvironment.setTenant(undefined, 'csvV2-register');
    // clean tenant upload paths to avoid cross-test interference (tenant-scoped)
    await testingEnvironment.cleanupUploadPaths();
  });

  afterEach(async () => {
    const base = tenants.current().uploadedDocuments;
    // remove per-test csv-imports folders deterministically to avoid leftovers
    // eslint-disable-next-line no-restricted-syntax
    for (const id of createdImportIds.splice(0)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.rm(path.join(base, 'csv-imports', id), { recursive: true, force: true });
    }
    // remove local temporary upload dirs
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

  const setUp = async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const idGenerator = IdGeneratorFactory.default();

    // Job registry -> execute extraction synchronously when dispatched
    const sockets = TestUtils.mockClass<V1WebSocketsWrapper>({
      emitToSession: jest.fn(),
      emitToTenant: jest.fn(),
    });
    const registry = {
      // name must match class name
      [CsvExtractUploadedZipJob.name]: async () => {
        // IMPORTANT: Use a fresh transaction manager for the job's use case
        const tmForJob = TransactionManagerFactory.default();
        const dsForJob = DefaultCsvImportsDataSource(tmForJob);
        const jobUseCase = new CsvExtractUploadedZipUseCase({
          csvImportsDS: dsForJob,
          fileStorage: new FileSystemStorage(pathManager),
          transactionManager: tmForJob,
          filesIO: new FileContentsIO(),
        });
        return new CsvExtractUploadedZipJob({
          useCase: jobUseCase,
          sockets,
        });
      },
    };
    const jobsDispatcher = new SyncDispatcherForTests(registry);

    const useCase = new RegisterCsvImportUseCase({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });

    return { useCase, csvImportsDS, sockets, pathManager };
  };

  const setUpIntermediate = async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const idGenerator = IdGeneratorFactory.default();

    class RecordingDispatcher implements JobsDispatcher {
      public calls: Array<{ name: string; params: any }> = [];

      // eslint-disable-next-line class-methods-use-this
      async dispatch(dispatchable: any, params: any): Promise<void> {
        this.calls.push({ name: dispatchable.name, params });
      }

      async dispatchMany(
        callback: (dispatch: <T>(dispatchable: any, params: any) => void) => Promise<void>
      ): Promise<void> {
        const capture = async (dispatchable: any, params: any) => {
          this.calls.push({ name: dispatchable.name, params });
        };
        await callback(capture);
      }
    }
    const jobsDispatcher = new RecordingDispatcher();

    const useCase = new RegisterCsvImportUseCase({
      csvImportsDS,
      fileStorage,
      transactionManager,
      idGenerator,
      jobsDispatcher,
    });

    return { useCase, csvImportsDS, pathManager, jobsDispatcher };
  };

  const uniqueSubdir = (base: string) =>
    path.join(__dirname, base, `${Date.now()}_${Math.random().toString(36).slice(2)}`);

  it('should persist as queued and dispatch job (intermediate state)', async () => {
    const { useCase, csvImportsDS, pathManager, jobsDispatcher } = await setUpIntermediate();

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
      sessionId: 'sess-1',
    });
    createdImportIds.push(result.id);

    const persisted = await csvImportsDS.getById(result.id);
    expect(persisted?.status).toBe('queued');
    expect(persisted?.storage?.path).toBe(`csv-imports/${result.id}/${uploadFilename}`);

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
    expect(jobsDispatcher.calls).toEqual([
      expect.objectContaining({
        name: CsvExtractUploadedZipJob.name,
        params: expect.objectContaining({
          tenantName: tenants.current().name,
          userId: f.idString('uploader'),
          importId: result.id,
          sessionId: 'sess-1',
        }),
      }),
    ]);
  });

  it('should persist import, store original file, and dispatch extraction job (sync)', async () => {
    const { useCase, csvImportsDS, sockets, pathManager } = await setUp();

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
      sessionId: 'sess-1',
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

    const persisted = await csvImportsDS.getById(result.id);
    expect(persisted).toBeDefined();
    expect(persisted).toEqual(
      expect.objectContaining({
        id: result.id,
        templateId: 'template-1',
        status: expect.any(String), // will likely be 'files extracted' because job ran sync
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

    // Extraction job should have created canonical extracted/import.csv
    const extractedPath = pathManager.createPath({
      type: 'customPath',
      destination: `csv-imports/${result.id}/extracted`,
      filename: 'import.csv',
    });
    await expect(fs.readFile(extractedPath, 'utf8')).resolves.toBe(csvContent);

    // Session emits occurred
    expect(sockets.emitToSession).toHaveBeenCalledWith('sess-1', 'csvImport:extract:start', {
      importId: result.id,
    });
    expect(sockets.emitToSession).toHaveBeenCalledWith('sess-1', 'csvImport:extract:success', {
      importId: result.id,
    });
  });
});
