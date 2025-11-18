/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs/promises';
import path from 'path';

import { tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultCsvImportsDataSource } from 'api/csv.v2/database/data_source_defaults';
import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { DiskFile } from 'api/files.v2/model/DiskFile';
import { CsvImportDomain, CsvImportStatus } from 'api/csv.v2/model/CsvImport';
import { createTestingZip } from 'api/csv/specs/helpers';
import { TestUtils } from 'api/common.v2/utils/Test';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { CsvExtractUploadedZipUseCase } from 'api/csv.v2/services/CsvExtractUploadedZipUseCase';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { CsvExtractUploadedZipJob } from '../CsvExtractUploadedZipJob';

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
    const csvImportsDS = DefaultCsvImportsDataSource(transactionManager);
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const useCase = new CsvExtractUploadedZipUseCase({
      csvImportsDS,
      fileStorage,
      transactionManager,
      filesIO: new FileContentsIO(),
    });
    const sockets = TestUtils.mockClass<V1WebSocketsWrapper>({
      emitToSession: jest.fn(),
      emitToTenant: jest.fn(),
    });
    const job = new CsvExtractUploadedZipJob({ useCase, sockets });
    return { csvImportsDS, pathManager, fileStorage, job, sockets };
  };

  const executeJob = async (
    job: CsvExtractUploadedZipJob,
    params: { importId: string; sessionId?: string },
    jobInfo: { maxRetries: number; retryCount: number } = { maxRetries: 5, retryCount: 1 }
  ) => {
    const f = getFixturesFactory();
    const heartBeat = jest.fn();
    await job.handleDispatch(
      heartBeat,
      { tenantName: tenants.current().name, userId: f.idString('uploader'), ...params },
      { namespace: tenants.current().name, ...jobInfo }
    );
    return heartBeat;
  };

  it('should emit start/progress/success to session and extract files', async () => {
    const { csvImportsDS, fileStorage, job, sockets } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-happy');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload.zip';

    const zipDir = path.join(__dirname, '../../../csv/specs/zipData');
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

    const heartBeat = await executeJob(job, { importId: id, sessionId: 'sess-1' });
    createdImportIds.push(id);

    const updated = await csvImportsDS.getById(id);
    expect(updated?.status).toBe(CsvImportStatus.FilesExtracted);
    expect(updated?.failure ?? undefined).toBeUndefined();
    expect(sockets.emitToSession).toHaveBeenCalledWith('sess-1', 'csvImport:extract:start', {
      importId: id,
    });
    expect(sockets.emitToSession).toHaveBeenCalledWith('sess-1', 'csvImport:extract:success', {
      importId: id,
    });
    // progress implies at least one heartbeat
    expect(heartBeat).toHaveBeenCalled();
  });

  it('should not emit when sessionId is missing', async () => {
    const { csvImportsDS, fileStorage, job, sockets } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-happy-no-session');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload.zip';

    const zipDir = path.join(__dirname, '../../../csv/specs/zipData');
    const tempZipDir = path.join(
      __dirname,
      'tmp',
      `${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    await fs.mkdir(tempZipDir, { recursive: true });
    await fs.mkdir(path.join(tempZipDir, 'zipData'), { recursive: true });
    await createTestingZip([path.join(zipDir, 'import.csv')], zipFilename, tempZipDir);
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
        createdBy: 'u1',
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await executeJob(job, { importId: id });
    createdImportIds.push(id);
    expect(sockets.emitToSession).not.toHaveBeenCalled();
  });

  it('should mark failed on last retry after error', async () => {
    const { csvImportsDS, fileStorage, job } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-error-last-retry');
    const destination = `csv-imports/${id}`;
    const zipFilename = 'upload.zip';

    const tempZipDir = path.join(__dirname, 'tmp');
    await fs.mkdir(tempZipDir, { recursive: true });
    await fs.mkdir(path.join(tempZipDir, 'zipData'), { recursive: true });
    // zip without import.csv to force NonRetryable
    const emptyDir = path.join(__dirname, '../../../csv/specs/zipData');
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
        createdBy: 'u1',
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await expect(
      executeJob(job, { importId: id, sessionId: 'sess-1' }, { maxRetries: 5, retryCount: 5 })
    ).rejects.toThrow();
    createdImportIds.push(id);

    const updated = await csvImportsDS.getById(id);
    expect(updated?.status).toBe(CsvImportStatus.Failed);
    expect(updated?.failure).toEqual(
      expect.objectContaining({
        retryable: false,
        stage: 'extracting files',
        message: expect.any(String),
        at: expect.any(Number),
      })
    );
  });
});
