/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs/promises';
import path from 'path';

import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { createTestingZip } from '#api/csv.v2/specs/helpers/createTestingZip.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { CsvPreflightJobHandler } from '../CsvPreflightJobHandler.js';
import { CsvImportDomain, CsvImportStatus } from '#api/csv.v2/domain/CsvImport.js';
import { CsvExtractUploadedZipJobHandler } from '../CsvExtractUploadedZipJobHandler.js';
import { CsvExtractUploadedZipJobFactory } from '../../factories/CsvExtractUploadedZipJobFactory.js';

describe('CsvExtractUploadedZipJob (integration)', () => {
  const createdImportIds: string[] = [];
  const createdTempDirs: string[] = [];
  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await testingEnvironment.setTenant(undefined, 'csvV2-job');
    await testingEnvironment.cleanupUploadPaths();
  });

  afterAll(async () => {
    await testingEnvironment.cleanupUploadPaths();
    await testingEnvironment.tearDown();
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

  const setUp = () => {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const jobsDispatcher: jest.Mocked<JobsDispatcher> = TestUtils.mockClass<JobsDispatcher>({
      dispatch: jest.fn().mockResolvedValue(undefined),
      dispatchMany: jest.fn().mockResolvedValue(undefined),
    }) as jest.Mocked<JobsDispatcher>;
    const { useCase, csvImportsDS } = CsvExtractUploadedZipJobFactory.build({
      transactionManager,
      fileStorage,
      jobsDispatcher,
    });
    const sockets = TestUtils.mockClass<V1WebSocketsWrapper>({
      emitToSession: jest.fn(),
      emitToTenant: jest.fn(),
      emitToTenantAdmins: jest.fn(),
    });
    const job = new CsvExtractUploadedZipJobHandler({ useCase, sockets });
    return { csvImportsDS, pathManager, fileStorage, job, sockets, jobsDispatcher };
  };

  const executeJob = async (
    job: CsvExtractUploadedZipJobHandler,
    params: { importId: string },
    jobInfo: { maxRetries: number; retryCount: number } = { maxRetries: 5, retryCount: 1 }
  ) => {
    const f = getFixturesFactory();
    const heartBeat = jest.fn();
    const userId = f.idString('uploader');
    await job.handleDispatch(
      heartBeat,
      { tenantName: tenants.current().name, userId, ...params },
      { namespace: tenants.current().name, ...jobInfo }
    );
    return { heartBeat, userId };
  };

  it('should emit start/progress/success to tenant admins and extract files', async () => {
    const { csvImportsDS, fileStorage, job, sockets, jobsDispatcher } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-happy');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload.zip';

    const zipDir = path.join(__dirname, '../../../specs/zipData');
    const tempZipDir = path.join(
      __dirname,
      'tmp',
      `${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(tempZipDir, { recursive: true });
    await fs.mkdir(path.join(tempZipDir, 'zipData'), { recursive: true });
    await createTestingZip(
      [path.join(zipDir, 'test.csv'), path.join(zipDir, 'import.csv'), path.join(zipDir, '1.pdf')],
      zipFilename,
      tempZipDir
    );
    createdTempDirs.push(tempZipDir);

    await fileStorage.storeContent(
      new DiskFile(path.join(tempZipDir, 'zipData', zipFilename)).toContent(),
      `${destination}/${zipFilename}`
    );
    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
        createdBy: 'u1',
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    const { heartBeat, userId } = await executeJob(job, { importId: id });
    createdImportIds.push(id);

    const updated = (await csvImportsDS.getById(id)).getDataOrThrow();
    expect(updated.status).toBe(CsvImportStatus.ExtractingFilesDone);
    expect(updated.failure ?? undefined).toBeUndefined();
    expect(sockets.emitToTenantAdmins).toHaveBeenCalledWith(
      tenants.current().name,
      'csvImport:extract:start',
      {
        importId: id,
      }
    );
    expect(sockets.emitToTenantAdmins).toHaveBeenCalledWith(
      tenants.current().name,
      'csvImport:extract:success',
      {
        importId: id,
      }
    );
    expect(sockets.emitToTenantAdmins).toHaveBeenCalledWith(
      tenants.current().name,
      'csvImport:extract:progress',
      expect.objectContaining({
        importId: id,
        stage: 'files',
        processedFiles: expect.any(Number),
      })
    );
    expect(sockets.emitToTenantAdmins).toHaveBeenCalledWith(
      tenants.current().name,
      'csvImport:extract:progress',
      expect.objectContaining({
        importId: id,
        stage: 'rows',
        stagedRows: expect.any(Number),
      })
    );
    // progress implies at least one heartbeat
    expect(heartBeat).toHaveBeenCalled();
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(CsvPreflightJobHandler, {
      tenantName: tenants.current().name,
      userId,
      importId: id,
    });
  });

  it('should mark failed on last retry after error', async () => {
    const { csvImportsDS, fileStorage, job, jobsDispatcher } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-error-last-retry');
    const userId = f.idString('uploader-error');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload.zip';

    const tempZipDir = path.join(__dirname, 'tmp');
    await fs.mkdir(tempZipDir, { recursive: true });
    await fs.mkdir(path.join(tempZipDir, 'zipData'), { recursive: true });
    // zip without import.csv to force NonRetryable
    const emptyDir = path.join(__dirname, '../../../specs/zipData');
    await createTestingZip([path.join(emptyDir, 'test.csv')], zipFilename, tempZipDir);
    await fileStorage.storeContent(
      new DiskFile(path.join(tempZipDir, 'zipData', zipFilename)).toContent(),
      `${destination}/${zipFilename}`
    );
    createdTempDirs.push(tempZipDir);
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

    await expect(
      executeJob(job, { importId: id }, { maxRetries: 5, retryCount: 5 })
    ).rejects.toThrow();
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
    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
