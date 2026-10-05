import http, { Server } from 'http';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { config } from '#api/config.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { ExternalDummyService } from '#api/services/tasksmanager/specs/ExternalDummyService.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MalformedOcrResult } from '../../../application/errors/MalformedOcrResult.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { OcrResultGone } from '../../../application/errors/OcrResultGone.js';
import { OcrServiceNotConfigured } from '../../../application/errors/OcrServiceNotConfigured.js';
import { OcrServiceUnavailable } from '../../../application/errors/OcrServiceUnavailable.js';
import { IdempotencyKey } from '../../../domain/IdempotencyKey.js';
import { OcrEngineFactory } from '../../factories/OcrEngineFactory.js';

const PORT = 1238;
const INFO_PORT = 1239;
const SERVICE_URL = `http://localhost:${PORT}`;
const PDF_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/result.pdf');

const settingsWithOcrUrl = (url?: string) => ({
  settings: [{ features: url ? { ocr: { url } } : {}, ocrServiceEnabled: true }],
});

const request = {
  key: IdempotencyKey.of('rec1', 1),
  filename: 'document.pdf',
  language: 'en' as const,
  content: Buffer.from('%PDF-1.4 content'),
};

const handle = { fileUrl: `${SERVICE_URL}/ocr_result` };

const readAll = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
};

describe('RemoteOcrEngine', () => {
  let service: ExternalDummyService;
  let infoServer: Server;
  let infoStatus = 200;

  beforeAll(async () => {
    service = new ExternalDummyService(PORT, 'ocr', {
      materialsFiles: '/upload/:tenant',
      resultsFile: '/ocr_result',
    });
    await service.start(`redis://${config.redis.host}:${config.redis.port}`);
    await Redis.connect();

    infoServer = http.createServer((_req, res) => {
      res.statusCode = infoStatus;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ supported_languages: ['en', 'es'] }));
    });
    await new Promise<void>(resolve => {
      infoServer.listen(INFO_PORT, resolve);
    });
  });

  afterAll(async () => {
    await new Promise(resolve => {
      infoServer.close(resolve);
    });
    await service.stop();
    await Redis.disconnect();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    infoStatus = 200;
    await testingEnvironment.setUp(settingsWithOcrUrl(SERVICE_URL));
    await service.resetQueue();
    service.reset();
  });

  const sut = () => testingEnvironment.runWithContext(() => OcrEngineFactory.default());

  describe('submit()', () => {
    it("should upload the PDF to the tenant's space, then queue a task carrying the key", async () => {
      await sut().submit(request);

      expect(service.filesNames).toEqual(['document.pdf']);
      expect(service.files[0].toString()).toBe('%PDF-1.4 content');
      expect(service.materialsFileParams).toEqual({ tenant: testingTenants.current().name });
      expect(JSON.parse((await service.readFirstTaskMessage())!)).toEqual({
        task: 'ocr',
        tenant: testingTenants.current().name,
        params: { filename: 'document.pdf', language: 'en', metadata: { key: 'rec1:1' } },
      });
    });

    it('should refuse to submit when no service url is configured', async () => {
      await testingEnvironment.setFixtures(settingsWithOcrUrl());

      await expect(sut().submit(request)).rejects.toBeInstanceOf(OcrServiceNotConfigured);
      expect(await service.readFirstTaskMessage()).toBeUndefined();
    });

    it('should report the service as unavailable when it cannot be reached, queueing nothing', async () => {
      await testingEnvironment.setFixtures(settingsWithOcrUrl('http://localhost:1'));

      await expect(sut().submit(request)).rejects.toBeInstanceOf(OcrServiceUnavailable);
      expect(await service.readFirstTaskMessage()).toBeUndefined();
    });

    it('should report the service as unavailable when the upload fails on its side', async () => {
      service.simulateServiceError(500);

      await expect(sut().submit(request)).rejects.toBeInstanceOf(OcrServiceUnavailable);
      expect(await service.readFirstTaskMessage()).toBeUndefined();
    });
  });

  describe('backlogSize()', () => {
    it('should count the tasks the service has not picked up yet', async () => {
      await sut().submit(request);
      await sut().submit({ ...request, key: IdempotencyKey.of('rec2', 1) });

      expect(await sut().backlogSize()).toBe(2);
    });
  });

  describe('fetchResult()', () => {
    beforeEach(() => {
      service.setFileResults(PDF_PATH);
    });

    it('should fetch the PDF and its mimetype', async () => {
      const { pdf, mimetype } = await sut().fetchResult(handle);

      expect(mimetype).toBe('application/pdf');
      expect(await readAll(pdf)).toContain('%PDF-1.4');
    });

    it('should report the result as gone when the service no longer has it', async () => {
      service.setFileResults(undefined as unknown as string);

      await expect(sut().fetchResult(handle)).rejects.toBeInstanceOf(OcrResultGone);
    });

    it('should report the service as unavailable when it cannot be reached', async () => {
      await expect(
        sut().fetchResult({ fileUrl: 'http://localhost:1/ocr_result' })
      ).rejects.toBeInstanceOf(OcrServiceUnavailable);
    });

    it('should reject a handle it did not produce', async () => {
      await expect(sut().fetchResult({ something: 'else' })).rejects.toBeInstanceOf(
        MalformedOcrResult
      );
    });
  });

  describe('supportsLanguage()', () => {
    const settingsWithInfo = async () =>
      testingEnvironment.setFixtures(settingsWithOcrUrl(`http://localhost:${INFO_PORT}`));

    it.each<[LanguageISO6391, boolean]>([
      ['en', true],
      ['es', true],
      ['fr', false],
    ])('should say whether the service supports %s', async (language, expected) => {
      await settingsWithInfo();

      expect(await sut().supportsLanguage(language)).toBe(expected);
    });

    it('should refuse to ask when no service url is configured', async () => {
      await testingEnvironment.setFixtures(settingsWithOcrUrl());

      await expect(sut().supportsLanguage('en')).rejects.toBeInstanceOf(OcrServiceNotConfigured);
    });

    it('should report the service as unavailable when it fails on its side', async () => {
      await settingsWithInfo();
      infoStatus = 503;

      await expect(sut().supportsLanguage('en')).rejects.toBeInstanceOf(OcrServiceUnavailable);
    });
  });
});
