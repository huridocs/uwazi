import { ExternalDummyService } from 'api/tasksmanager/specs/ExternalDummyService';
import { testingDB } from 'api/utils/testing_db';
import {
  fixturesOneFile,
  fixturesPdfName,
  fixturesTwelveFiles,
} from 'api/pdfsegmentation/specs/fixtures';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import fs from 'fs';
import {
  PdfSegmentation,
  SERVICE_NAME,
  SegmentationParameters,
} from 'api/pdfsegmentation/PdfSegmentation';
import { RedisServer } from 'api/tasksmanager/RedisServer';
import waitForExpect from 'wait-for-expect';

describe('pdfSegmentation', () => {
  let redisServer: RedisServer;
  let segmentationMockService: ExternalDummyService;
  let pdfSegmentation: PdfSegmentation;
  let segmentationConnectionParameters: SegmentationParameters;

  beforeAll(async () => {
    redisServer = new RedisServer();

    await redisServer.start();
    segmentationConnectionParameters = {
      dataUrl: 'http://localhost:1234/data',
      filesUrl: 'http://localhost:1234/files',
      resultsUrl: 'http://localhost:1234/results',
      redisUrl: 'redis://localhost:6379',
    };

    segmentationMockService = new ExternalDummyService(1234, SERVICE_NAME);
    await segmentationMockService.start(segmentationConnectionParameters.redisUrl);
  });

  beforeEach(() => {
    segmentationMockService.reset();
  });

  afterAll(async () => {
    await testingDB.disconnect();
    await segmentationMockService.stop();
    await pdfSegmentation?.stop();
    await redisServer.stop();
  });

  it('should send one pdfs to segment', async () => {
    await testingEnvironment.setUp(fixturesOneFile);

    pdfSegmentation = new PdfSegmentation(segmentationConnectionParameters);
    await pdfSegmentation.start();

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfName}`);

    await waitForExpect(async () => {
      expect(segmentationMockService.files.length).toEqual(1);
    });

    expect(segmentationMockService.files[0]).toEqual(file);
    expect(segmentationMockService.filesNames[0]).toEqual(fixturesPdfName);

    const message = await segmentationMockService.readFirstTaskMessage();
    expect(message).toEqual(`{"task":"${fixturesPdfName}","tenant":"tenant1"}`);
  });

  it('should send 12 pdfs to segment', async () => {
    await testingEnvironment.setUp(fixturesTwelveFiles);
    pdfSegmentation = new PdfSegmentation(segmentationConnectionParameters);
    await pdfSegmentation.start();

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfName}`);

    await waitForExpect(async () => {
      expect(segmentationMockService.files.length).toEqual(12);
    });

    expect(segmentationMockService.files[0]).toEqual(file);
    expect(segmentationMockService.filesNames[0]).toEqual(fixturesPdfName);
    expect(segmentationMockService.files[9]).toEqual(file);
    expect(segmentationMockService.filesNames[9]).toEqual(fixturesPdfName);

    const messages = await segmentationMockService.readAllTaskMessages();
    expect(messages.length).toEqual(12);
    expect(messages[0]).toEqual(`{"task":"${fixturesPdfName}","tenant":"tenant1"}`);
  });
});
