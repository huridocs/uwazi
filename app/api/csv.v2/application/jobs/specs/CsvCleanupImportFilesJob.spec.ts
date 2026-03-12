/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import * as fs from 'fs/promises';
import path from 'path';

import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CsvCleanupImportFilesJobFactory } from '../../../infrastructure/factories/CsvCleanupImportFilesJobFactory.js';

describe('CsvCleanupImportFilesJob (integration)', () => {
  const createdImportIds: string[] = [];
  const createdTempDirs: string[] = [];

  beforeEach(async () => {
    await testingEnvironment.setUp({});
    await testingEnvironment.setTenant(undefined, 'csvV2-cleanup');
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
    const fileStorage = new FileSystemStorage(new PathManager({ tenant: tenants.current() }));
    return CsvCleanupImportFilesJobFactory.build({ transactionManager, fileStorage });
  };

  const createTmpFile = async (relativeName: string) => {
    const dir = path.join(__dirname, 'tmp', `${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, relativeName);
    await fs.writeFile(filePath, `${relativeName}-content`);
    createdTempDirs.push(dir);
    return filePath;
  };

  const storeImportArtifact = async (
    fileStorage: FileStorage,
    subpath: string,
    sourceFilePath: string
  ) => fileStorage.storeContent(new DiskFile(sourceFilePath).toContent(), subpath);

  it('should remove csv import artifacts and mark filesCleanup done', async () => {
    const { useCase, csvImportsDS, fileStorage } = setUp();
    const f = getFixturesFactory();
    const importId = f.idString('cleanup-terminal');
    const destination = `csv-imports/${importId}`;
    const originalPath = `${destination}/upload.zip`;
    const extractedCsvPath = `${destination}/extracted/import.csv`;
    const extractedPdfPath = `${destination}/extracted/1.pdf`;
    const reportPath = `${destination}/reports/failed_rows.csv`;

    await storeImportArtifact(fileStorage, originalPath, await createTmpFile('upload.zip'));
    await storeImportArtifact(fileStorage, extractedCsvPath, await createTmpFile('import.csv'));
    await storeImportArtifact(fileStorage, extractedPdfPath, await createTmpFile('1.pdf'));
    await storeImportArtifact(fileStorage, reportPath, await createTmpFile('failed_rows.csv'));

    const csvImport = CsvImportDomain.withFilesCleanup(
      CsvImportDomain.withExtraction(
        CsvImportDomain.withStorage(
          CsvImportDomain.withStatus(
            CsvImportDomain.create({
              id: importId,
              templateId: 't1',
              file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
              createdBy: f.idString('cleanup-user'),
            }),
            CsvImportStatus.ImportEntitiesDone
          ),
          originalPath
        ),
        {
          sourceType: 'zip',
          originalUploadSizeBytes: 10,
          extractedFilesCount: 2,
          totalFilesInZip: 2,
          files: [
            { filename: 'import.csv', sizeBytes: 1 },
            { filename: '1.pdf', sizeBytes: 1 },
          ],
        }
      ),
      'pending'
    );
    await csvImportsDS.insert(csvImport);
    createdImportIds.push(importId);

    await useCase.execute({ importId });

    const after = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(after.status).toBe(CsvImportStatus.ImportEntitiesDone);
    expect(after.filesCleanup).toBe('done');

    const pathManager = new PathManager({ tenant: tenants.current() });
    await expect(
      fs.access(pathManager.createPath({ type: 'customPath', destination, filename: 'upload.zip' }))
    ).rejects.toBeDefined();
    await expect(
      fs.access(
        pathManager.createPath({ type: 'customPath', destination: `${destination}/extracted`, filename: 'import.csv' })
      )
    ).rejects.toBeDefined();
    await expect(
      fs.access(
        pathManager.createPath({ type: 'customPath', destination: `${destination}/extracted`, filename: '1.pdf' })
      )
    ).rejects.toBeDefined();
    await expect(
      fs.access(
        pathManager.createPath({
          type: 'customPath',
          destination: `${destination}/reports`,
          filename: 'failed_rows.csv',
        })
      )
    ).resolves.toBeUndefined();
  });

  it('should not run cleanup for non-terminal imports', async () => {
    const { useCase, csvImportsDS, fileStorage } = setUp();
    const f = getFixturesFactory();
    const importId = f.idString('cleanup-non-terminal');
    const destination = `csv-imports/${importId}`;
    const originalPath = `${destination}/upload.csv`;
    await storeImportArtifact(fileStorage, originalPath, await createTmpFile('upload.csv'));

    const csvImport = CsvImportDomain.withStorage(
      CsvImportDomain.withStatus(
        CsvImportDomain.create({
          id: importId,
          templateId: 't1',
          file: { originalName: 'upload.csv', mimeType: 'text/csv', size: 10 },
          createdBy: f.idString('cleanup-user-2'),
        }),
        CsvImportStatus.ExtractingFiles
      ),
      originalPath
    );
    await csvImportsDS.insert(csvImport);
    createdImportIds.push(importId);

    await useCase.execute({ importId });

    const after = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(after.status).toBe(CsvImportStatus.ExtractingFiles);
    expect(after.filesCleanup ?? undefined).toBeUndefined();

    const pathManager = new PathManager({ tenant: tenants.current() });
    await expect(
      fs.access(pathManager.createPath({ type: 'customPath', destination, filename: 'upload.csv' }))
    ).resolves.toBeUndefined();
  });

  it('should be idempotent when files are already missing', async () => {
    const { useCase, csvImportsDS } = setUp();
    const f = getFixturesFactory();
    const importId = f.idString('cleanup-idempotent');
    const destination = `csv-imports/${importId}`;
    const originalPath = `${destination}/upload.zip`;

    const csvImport = CsvImportDomain.withFilesCleanup(
      CsvImportDomain.withStorage(
        CsvImportDomain.withStatus(
          CsvImportDomain.create({
            id: importId,
            templateId: 't1',
            file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
            createdBy: f.idString('cleanup-user-3'),
          }),
          CsvImportStatus.Cancelled
        ),
        originalPath
      ),
      'pending'
    );
    await csvImportsDS.insert(csvImport);
    createdImportIds.push(importId);

    await expect(useCase.execute({ importId })).resolves.toBeUndefined();
    await expect(useCase.execute({ importId })).resolves.toBeUndefined();

    const after = (await csvImportsDS.getById(importId)).getDataOrThrow();
    expect(after.status).toBe(CsvImportStatus.Cancelled);
    expect(after.filesCleanup).toBe('done');
  });
});
