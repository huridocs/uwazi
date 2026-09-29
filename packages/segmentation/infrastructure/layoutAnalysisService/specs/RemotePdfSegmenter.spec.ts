import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { config } from '#api/config.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { ExternalDummyService } from '#api/services/tasksmanager/specs/ExternalDummyService.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MalformedSegmentationResult } from '../../../application/errors/MalformedSegmentationResult.js';
import { SegmentationResultGone } from '../../../application/errors/SegmentationResultGone.js';
import { SegmentationServiceNotConfigured } from '../../../application/errors/SegmentationServiceNotConfigured.js';
import { SegmentationServiceUnavailable } from '../../../application/errors/SegmentationServiceUnavailable.js';
import { IdempotencyKey } from '../../../domain/IdempotencyKey.js';
import { SegmentType } from '../../../domain/SegmentType.js';
import { PdfSegmenterFactory } from '../../factories/PdfSegmenterFactory.js';

const PORT = 1236;
const SERVICE_URL = `http://localhost:${PORT}`;
const XML_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/layout.xml');
const XML_CONTENT =
  '<?xml version="1.0" encoding="UTF-8"?>\n<pdf2xml><page number="1"/></pdf2xml>\n';

const settingsWithSegmentationUrl = (url?: string) => ({
  settings: [{ features: url ? { segmentation: { url } } : {} }],
});

const request = {
  key: IdempotencyKey.of('seg1', 1),
  filename: 'document.pdf',
  content: Buffer.from('%PDF-1.4 content'),
};

const handle = { dataUrl: `${SERVICE_URL}/get_paragraphs`, fileUrl: `${SERVICE_URL}/get_xml` };

const extractionData = {
  tenant: 'tenant',
  file_name: 'document.pdf',
  page_width: 612,
  page_height: 792,
  paragraphs: [
    {
      left: 1,
      top: 2,
      width: 3,
      height: 4,
      page_number: 1,
      page_width: 612,
      page_height: 792,
      text: 'A table',
      type: 'Table',
    },
  ],
};

const readAll = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
};

describe('RemotePdfSegmenter', () => {
  let service: ExternalDummyService;

  beforeAll(async () => {
    service = new ExternalDummyService(PORT, 'segmentation', {
      materialsFiles: '/async_extraction/:tenant',
      resultsData: '/get_paragraphs',
      resultsFile: '/get_xml',
    });
    await service.start(`redis://${config.redis.host}:${config.redis.port}`);
    await Redis.connect();
  });

  afterAll(async () => {
    await service.stop();
    await Redis.disconnect();
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(settingsWithSegmentationUrl(`${SERVICE_URL}/async_extraction`));
    await service.resetQueue();
    service.reset();
  });

  const sut = () => testingEnvironment.runWithContext(() => PdfSegmenterFactory.default());

  describe('submit()', () => {
    it("should upload the PDF to the tenant's space, then queue a task carrying the key", async () => {
      await sut().submit(request);

      expect(service.filesNames).toEqual(['document.pdf']);
      expect(service.files[0].toString()).toBe('%PDF-1.4 content');
      expect(service.materialsFileParams).toEqual({ tenant: testingTenants.current().name });
      expect(JSON.parse((await service.readFirstTaskMessage())!)).toEqual({
        task: 'segmentation',
        tenant: testingTenants.current().name,
        params: { filename: 'document.pdf', idempotency_key: 'seg1:1' },
      });
    });

    it('should refuse to submit when no service url is configured', async () => {
      await testingEnvironment.setFixtures(settingsWithSegmentationUrl());

      await expect(sut().submit(request)).rejects.toBeInstanceOf(SegmentationServiceNotConfigured);
      expect(await service.readFirstTaskMessage()).toBeUndefined();
    });

    it('should report the service as unavailable when it cannot be reached, queueing nothing', async () => {
      await testingEnvironment.setFixtures(
        settingsWithSegmentationUrl('http://localhost:1/async_extraction')
      );

      await expect(sut().submit(request)).rejects.toBeInstanceOf(SegmentationServiceUnavailable);
      expect(await service.readFirstTaskMessage()).toBeUndefined();
    });

    it('should report the service as unavailable when the upload fails on its side', async () => {
      service.simulateServiceError(500);

      await expect(sut().submit(request)).rejects.toBeInstanceOf(SegmentationServiceUnavailable);
      expect(await service.readFirstTaskMessage()).toBeUndefined();
    });
  });

  describe('backlogSize()', () => {
    it('should count the tasks the service has not picked up yet', async () => {
      await sut().submit(request);
      await sut().submit({ ...request, key: IdempotencyKey.of('seg2', 1) });

      expect(await sut().backlogSize()).toBe(2);
    });
  });

  describe('fetchLayout()', () => {
    beforeEach(() => {
      service.setResults(extractionData);
      service.setFileResults(XML_PATH);
    });

    it('should fetch the layout, translated, and the xml', async () => {
      const { layout, xml } = await sut().fetchLayout(handle);

      expect(layout.pages).toEqual([{ number: 1, width: 612, height: 792 }]);
      expect(layout.segments.map(s => ({ ...s }))).toEqual([
        {
          left: 1,
          top: 2,
          width: 3,
          height: 4,
          pageNumber: 1,
          text: 'A table',
          type: SegmentType.TABLE,
        },
      ]);
      expect(await readAll(xml)).toBe(XML_CONTENT);
    });

    it.each([
      ['the layout was already handed out', 404],
      ['the service failed to find it', 422],
    ])('should report the result as gone when %s', async (_case, status) => {
      service.simulateServiceError(status);

      await expect(sut().fetchLayout(handle)).rejects.toBeInstanceOf(SegmentationResultGone);
    });

    it('should report the result as gone when the xml is no longer there', async () => {
      service.setFileResults(undefined as unknown as string);

      await expect(sut().fetchLayout(handle)).rejects.toBeInstanceOf(SegmentationResultGone);
    });

    it('should report the service as unavailable when it fails on its side', async () => {
      service.simulateServiceError(503);

      await expect(sut().fetchLayout(handle)).rejects.toBeInstanceOf(
        SegmentationServiceUnavailable
      );
    });

    it('should reject a layout it cannot understand', async () => {
      service.setResults({ unexpected: true });

      await expect(sut().fetchLayout(handle)).rejects.toBeInstanceOf(MalformedSegmentationResult);
    });

    it('should reject a handle it did not produce', async () => {
      await expect(sut().fetchLayout({ something: 'else' })).rejects.toBeInstanceOf(
        MalformedSegmentationResult
      );
    });
  });
});
