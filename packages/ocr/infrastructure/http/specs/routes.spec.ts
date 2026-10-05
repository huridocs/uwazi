import type { Application, NextFunction, Request, Response } from 'express';
import fetchMock from 'fetch-mock';
import { writeFile } from 'fs/promises';
import path from 'path';
import request from 'supertest';
import { Redis } from '#api/infrastructure/Redis.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { f, record, withRecords } from '../../../application/specs/OcrIntakeFixtures.js';
import { OcrRoutes } from '../OcrRoutes.js';

const admin = { _id: f.id('admin'), username: 'admin', role: 'admin' };
const editor = { _id: f.id('editor'), username: 'editor', role: 'editor' };
const collaborator = { _id: f.id('collab'), username: 'collab', role: 'collaborator' };

const PDFS = ['scan.pdf', 'french.pdf', 'attachment.pdf'];

describe('ocr routes', () => {
  let user: object | undefined = admin;

  const app: Application = setUpApp(
    OcrRoutes.register,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = user;
      next();
    }
  );

  const setUp = async (records: object[] = [], features?: Parameters<typeof withRecords>[1]) => {
    await testingEnvironment.setUp(withRecords(records, features));
    await testingEnvironment.setupTenantTmpPaths([]);
    await Promise.all(
      PDFS.map(async name =>
        writeFile(path.join(testingTenants.current().uploadedDocuments, name), '%PDF-1.4')
      )
    );
    await testingEnvironment.jobs.clear();
  };

  beforeAll(async () => {
    await Redis.connect();
  });

  beforeEach(() => {
    user = admin;
    fetchMock.mock(
      'http://ocr/info',
      { supported_languages: ['en', 'es'] },
      { overwriteRoutes: true }
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  afterAll(async () => {
    await Redis.disconnect();
    await testingEnvironment.tearDown();
  });

  describe('GET /api/files/:filename/ocr', () => {
    it('should report a file with no record as noOCR', async () => {
      await setUp();

      const { body } = await request(app).get('/api/files/scan.pdf/ocr').expect(200);

      expect(body).toEqual({ status: 'noOCR' });
    });

    it.each([
      ['queued', { status: 'queued' }, 'inQueue'],
      ['processing', { status: 'processing', attempt: 1 }, 'inQueue'],
      ['failed', { status: 'failed', attempt: 1 }, 'cannotProcess'],
      ['ready', { status: 'ready', attempt: 1, resultFile: f.id('result') }, 'withOCR'],
    ])('should report a %s record as %s, with its last update', async (_case, record_, wire) => {
      await setUp([record('scan', { sourceFile: f.id('scan'), lastUpdated: 4000, ...record_ })]);

      const { body } = await request(app).get('/api/files/scan.pdf/ocr').expect(200);

      expect(body).toEqual({ status: wire, lastUpdated: 4000 });
    });

    it('should report unsupported_language for a language the service does not read', async () => {
      await setUp();

      const { body } = await request(app).get('/api/files/french.pdf/ocr').expect(200);

      expect(body).toEqual({ status: 'unsupported_language' });
    });

    it('should answer 404 for a file that does not exist', async () => {
      await setUp();

      await request(app).get('/api/files/invalidFile/ocr').expect(404);
    });

    it('should answer 400 for a file that is not a document', async () => {
      await setUp();

      await request(app).get('/api/files/attachment.pdf/ocr').expect(400);
    });

    it('should answer 404 when OCR is not enabled', async () => {
      await setUp([], { serviceEnabled: false });

      await request(app).get('/api/files/scan.pdf/ocr').expect(404);
    });

    it.each([
      ['a collaborator', collaborator],
      ['nobody', undefined],
    ])('should answer 401 to %s', async (_case, who) => {
      await setUp();
      user = who;

      await request(app).get('/api/files/scan.pdf/ocr').expect(401);
    });

    it('should allow an editor', async () => {
      await setUp();
      user = editor;

      await request(app).get('/api/files/scan.pdf/ocr').expect(200);
    });
  });

  describe('POST /api/files/:filename/ocr', () => {
    it('should queue the file, which then reports as in the queue', async () => {
      await setUp();

      await request(app).post('/api/files/scan.pdf/ocr').expect(200);

      const { body } = await request(app).get('/api/files/scan.pdf/ocr').expect(200);
      expect(body).toMatchObject({ status: 'inQueue' });
    });

    it('should answer 404 for a file that does not exist', async () => {
      await setUp();

      await request(app).post('/api/files/invalidFile/ocr').expect(404);
    });

    it('should answer 400 for a file that is not a document', async () => {
      await setUp();

      await request(app).post('/api/files/attachment.pdf/ocr').expect(400);
    });

    it('should answer 409 for a file that already has a task', async () => {
      await setUp([record('scan', { sourceFile: f.id('scan'), status: 'processing', attempt: 1 })]);

      await request(app).post('/api/files/scan.pdf/ocr').expect(409);
    });

    it('should answer 422 for a language the service does not read', async () => {
      await setUp();

      await request(app).post('/api/files/french.pdf/ocr').expect(422);
    });

    it('should answer 404 when OCR is not enabled', async () => {
      await setUp([], { ocrOn: false });

      await request(app).post('/api/files/scan.pdf/ocr').expect(404);
    });

    it('should answer 401 to a collaborator', async () => {
      await setUp();
      user = collaborator;

      await request(app).post('/api/files/scan.pdf/ocr').expect(401);
    });
  });
});
