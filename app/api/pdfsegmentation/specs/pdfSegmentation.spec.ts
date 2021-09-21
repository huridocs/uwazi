import { testingDB, fixturer } from 'api/utils/testing_db';
import {
  fixturesFilesWithtMixedInformationExtraction,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesTwelveFiles,
} from 'api/pdfsegmentation/specs/fixtures';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import fs from 'fs';
import { TaskManager } from 'api/tasksmanager/taskManager';
import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { SegmentPdfs } from '../segmentPdfs';
import { Db } from 'mongodb';

jest.mock('api/tasksmanager/taskManager.ts');

describe('pdfSegmentation', () => {
  let segmentPdfs: SegmentPdfs;

  const tenantOne = {
    name: 'tenantOne',
    dbName: 'tenantOne',
    indexName: 'tenantOne',
    uploadedDocuments: `${__dirname}/uploads`,
    attachments: `${__dirname}/uploads`,
    customUploads: `${__dirname}/uploads`,
    temporalFiles: `${__dirname}/uploads`,
  };

  const tenantTwo = {
    name: 'tenantTwo',
    dbName: 'tenantTwo',
    indexName: 'tenantTwo',
    uploadedDocuments: `${__dirname}/uploads`,
    attachments: `${__dirname}/uploads`,
    customUploads: `${__dirname}/uploads`,
    temporalFiles: `${__dirname}/uploads`,
  };

  let dbOne: Db;
  let dbTwo: Db;

  afterAll(async () => {
    await testingDB.disconnect();
  });

  beforeEach(async () => {
    segmentPdfs = new SegmentPdfs();
    await DB.connect();
    dbOne = DB.connectionForDB(tenantOne.dbName).db;
    dbTwo = DB.connectionForDB(tenantTwo.dbName).db;
    tenants.tenants = { tenantOne };
  });

  it('should send one pdf to segment', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

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
    await fixturer.clearAllAndLoad(dbOne, fixturesOtherFile);

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
    await fixturer.clearAllAndLoad(dbOne, fixturesTwelveFiles);
    await segmentPdfs.segmentPdfs();

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledTimes(10);
  });

  it('should send pdfs only from templates with the information extraction on', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFilesWithtMixedInformationExtraction);

    await segmentPdfs.segmentPdfs();

    const file = fs.readFileSync(`app/api/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledTimes(2);
  });

  it('should send pdfs from different tenants with the information extraction on', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);
    await fixturer.clearAllAndLoad(dbTwo, fixturesOtherFile);
    tenants.tenants = { tenantOne, tenantTwo };

    await segmentPdfs.segmentPdfs();

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledTimes(2);
  });

  //TODO
  // - should call start task
  // - should store which entities are already segmented
  // - should only send pdfs not already segmented
  // - should handle tenants without the information extraction on
  // - should get the results from the task and store them
  // - do a load test to checkl the perfomance
  // - make sure onlye one taskmanager is instanced
  // - error handling ? task failed ?
});
