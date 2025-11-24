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
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { DiskFile } from 'api/core/domain/files/DiskFile';
import { CSVImportEntitiesFactories } from 'api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories';
import { CsvExtractUploadedZipJob, Callbacks } from '../CsvExtractUploadedZipJob';

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

  const setUp = () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const tenant = tenants.current();
    const pathManager = new PathManager({ tenant });
    const fileStorage = new FileSystemStorage(pathManager);
    const useCase = new CsvExtractUploadedZipJob({
      csvImportsDS,
      fileStorage,
      transactionManager,
      filesIO: new FileContentsIO(),
    });
    return { useCase, csvImportsDS, pathManager, fileStorage };
  };

  it('should normalize a single CSV to extracted/import.csv and set final status', async () => {
    const { useCase, csvImportsDS, pathManager, fileStorage } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('csv-only');

    // prepare original CSV in storage path
    const destination = `csv-imports/${id}`;
    const originalFilename = 'original.csv';
    const disk = path.join(__dirname, '../../../../files/specs/testing_files', 'documento.txt');
    await fileStorage.storeContent(
      new DiskFile(disk).toContent(),
      `${destination}/${originalFilename}`
    );

    // insert import doc (queued) with storage path
    const importDoc = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id,
        templateId: 't1',
        file: { originalName: 'orig', mimeType: 'text/csv', size: 10 },
        createdBy: 'u1',
      }),
      `${destination}/${originalFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await useCase.execute({ importId: id, callbacks });
    createdImportIds.push(id);

    const updated = await csvImportsDS.getById(id);
    expect(updated?.status).toBe(CsvImportStatus.ExtractingFilesDone);
    expect(updated?.failure ?? undefined).toBeUndefined();
    const extractedPath = pathManager.createPath({
      type: 'customPath',
      destination: `${destination}/extracted`,
      filename: 'import.csv',
    });
    await expect(fs.access(extractedPath)).resolves.toBeUndefined();
  });

  it('should extract a ZIP with root files and require import.csv', async () => {
    const { useCase, csvImportsDS, pathManager, fileStorage } = setUp();
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
        createdBy: 'u1',
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await useCase.execute({ importId: id, callbacks });
    createdImportIds.push(id);

    const updated = await csvImportsDS.getById(id);
    expect(updated?.status).toBe(CsvImportStatus.ExtractingFilesDone);
    expect(updated?.failure ?? undefined).toBeUndefined();
    const extractedDir = pathManager.createPath({
      type: 'customPath',
      destination: `${destination}/extracted`,
      filename: '',
    });
    await expect(fs.access(path.join(extractedDir, 'import.csv'))).resolves.toBeUndefined();
  });

  it('should throw NonRetryableJobError when import not found', async () => {
    const { useCase } = setUp();
    const f = getFixturesFactory();
    await expect(
      useCase.execute({ importId: f.idString('non-existent'), callbacks })
    ).rejects.toBeInstanceOf(NonRetryableJobError);
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
    await expect(useCase.execute({ importId: id, callbacks })).rejects.toBeInstanceOf(
      NonRetryableJobError
    );
    const after = await csvImportsDS.getById(id);
    expect(after?.status).toBe(CsvImportStatus.ExtractingFiles);
  });

  it('should set failed when ZIP is missing import.csv', async () => {
    const { useCase, csvImportsDS, fileStorage } = setUp();
    const f = getFixturesFactory();
    const id = f.idString('zip-missing-import');
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
        createdBy: 'u1',
      }),
      `${destination}/${zipFilename}`
    );
    await csvImportsDS.insert(importDoc);

    await expect(useCase.execute({ importId: id, callbacks })).rejects.toBeInstanceOf(
      NonRetryableJobError
    );
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
