/* eslint-disable max-statements */
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { csvImportRoutes } from '#api/csv.v2/infrastructure/http/routes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { UserSchema } from '#shared/types/userType.js';
import { adminUser, collabUser, fixtures, importTemplate } from '#api/files/specs/fixtures.js';
import { CsvImportDomain, CsvImportStatus } from '#api/csv.v2/domain/CsvImport.js';
import { CSVImportEntitiesFactories } from '#api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories.js';
import {
  applyCsvJobBackendFlags,
  clearCsvStores,
  csvJobBackendConfigs,
} from '#api/csv.v2/specs/csvBackendTest.js';

jest.mock(
  '#api/auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('csv v2 routes', () => {
  const requestMockedUser: UserSchema = collabUser;

  const app: Application = setUpApp(
    csvImportRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => testingEnvironment.tearDown());

  const storeCsv = async (reportPath: string, csvContent: string) => {
    const fileStorage = FileStorageFactory.default();
    const content = new FileContents(async function* streamCallback() {
      yield new TextEncoder().encode(csvContent);
    });
    await fileStorage.storeContent(content, reportPath);
  };

  const insertCsvImportWithReport = async (importId: string, reportPath?: string) => {
    await testingEnvironment.runWithContext(async () => {
      const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault();
      const created = CsvImportDomain.create({
        id: importId,
        templateId: importTemplate.toString(),
        file: {
          originalName: 'import.csv',
          mimeType: 'text/csv',
          size: 12,
        },
        createdBy: adminUser._id.toString(),
      });
      const withStatus = CsvImportDomain.withStatus(created, CsvImportStatus.Completed);
      const csvImport = reportPath
        ? CsvImportDomain.withRowErrors(withStatus, {
            failedRows: 1,
            reportPath,
          })
        : withStatus;
      await csvImportsDS.insert(csvImport);
    });
  };

  const expectFailedRowsCsvDownload = async (importId: string, csvContent: string) => {
    const response = await request(app).get(
      `/api/csvImportEntities/imports/${importId}/failed-rows-csv`
    );

    expect(response).toHaveStatus(200);
    expect(response.header['content-type']).toContain('text/csv');
    expect(response.header['content-disposition']).toContain('attachment;');
    expect(response.header['content-disposition']).toContain("filename*=UTF-8''failed_rows.csv");
    expect(response.text).toBe(csvContent);
  };

  describe.each(csvJobBackendConfigs)('$name', ({ postgresCsv, postgresCore }) => {
    beforeEach(async () => {
      applyCsvJobBackendFlags(postgresCsv, postgresCore);
      await testingEnvironment.cleanupUploadPaths();
      await clearCsvStores();
    });

    it('POST /api/csvImportEntities should register a CSV v2 import and return queued response', async () => {
      const response = await request(app)
        .post('/api/csvImportEntities')
        .field('template', importTemplate.toString())
        .attach('file', testingEnvironment.testingFilesPath('importcsv.csv'));

      expect(response).toHaveStatus(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          status: 'queued',
          message: 'Import registered and queued for processing.',
        })
      );
    });

    it('GET /api/csvImportEntities/imports/:id/failed-rows-csv should download failed rows csv report', async () => {
      const importId = '000000000000000000000201';
      const reportPath = `csv-imports/${importId}/reports/failed_rows.csv`;
      const csvContent = 'title,year\nfailed entity,2024\n';

      await insertCsvImportWithReport(importId, reportPath);
      await storeCsv(reportPath, csvContent);
      await expectFailedRowsCsvDownload(importId, csvContent);
    });

    it('GET /api/csvImportEntities/imports/:id/failed-rows-csv should return 404 when report path is missing on import', async () => {
      const importId = '000000000000000000000202';
      await insertCsvImportWithReport(importId);

      const response = await request(app).get(
        `/api/csvImportEntities/imports/${importId}/failed-rows-csv`
      );

      expect(response).toHaveStatus(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('does not have a failed rows CSV report'),
        })
      );
    });

    it('GET /api/csvImportEntities/imports/:id/failed-rows-csv should return 404 when import does not exist', async () => {
      const response = await request(app).get(
        '/api/csvImportEntities/imports/000000000000000000000203/failed-rows-csv'
      );

      expect(response).toHaveStatus(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('was not found'),
        })
      );
    });

    it('GET /api/csvImportEntities/imports/:id/failed-rows-csv should return 404 when report file is missing in storage', async () => {
      const importId = '000000000000000000000204';
      const reportPath = `csv-imports/${importId}/reports/failed_rows.csv`;
      await insertCsvImportWithReport(importId, reportPath);

      const response = await request(app).get(
        `/api/csvImportEntities/imports/${importId}/failed-rows-csv`
      );

      expect(response).toHaveStatus(404);
    });
  });
});
