import { testingDB } from 'api/utils/testing_db';
import {
  fixturesFilesWithoutInformationExtraction,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesTwelveFiles,
} from 'api/pdfsegmentation/specs/fixtures';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import fs from 'fs';
import { TaskManager } from 'api/tasksmanager/taskManager';
import { config } from 'api/config';
import { SegmentPdfs } from '../segmentPdfs';

jest.mock('api/tasksmanager/taskManager.ts');

describe('pdfSegmentation', () => {
  let segmentPdfs: SegmentPdfs;

  afterAll(async () => {
    await testingDB.disconnect();
  });

  beforeEach(() => {
    segmentPdfs = new SegmentPdfs();
  });

  it('should send one pdf to segment', async () => {
    await testingEnvironment.setUp(fixturesOneFile);

    await segmentPdfs.segmentPdfs();

    expect(TaskManager).toHaveBeenCalledWith({
      serviceName: 'segmentation',
      dataUrl: 'http://localhost:1234/data',
      filesUrl: 'http://localhost:1234/files',
      resultsUrl: 'http://localhost:1234/results',
      redisUrl: `redis://${config.redis.host}:${config.redis.host}`,
    });

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );
  });

  it('should send other pdf to segment', async () => {
    await testingEnvironment.setUp(fixturesOtherFile);

    await segmentPdfs.segmentPdfs();

    expect(TaskManager).toHaveBeenCalledWith({
      serviceName: 'segmentation',
      dataUrl: 'http://other-localhost:1234/data',
      filesUrl: 'http://other-localhost:1234/files',
      resultsUrl: 'http://other-localhost:1234/results',
      redisUrl: `redis://${config.redis.host}:${config.redis.host}`,
    });

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );
  });

  it('should send 10 pdfs to segment', async () => {
    await testingEnvironment.setUp(fixturesTwelveFiles);

    await segmentPdfs.segmentPdfs();

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledTimes(10);
  });

  it('should send pdfs only from templates with the information extraction on', async () => {
    await testingEnvironment.setUp(fixturesFilesWithoutInformationExtraction);

    await segmentPdfs.segmentPdfs();

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledTimes(2);
  });
});
