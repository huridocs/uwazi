import { testingDB, fixturer } from 'api/utils/testing_db';
import {
  fixturesFilesWithtMixedInformationExtraction,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesTwelveFiles,
} from 'api/services/pdfsegmentation/specs/fixtures';

import fs from 'fs';
import { TaskManager } from 'api/services/tasksmanager/taskManager';
import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { SegmentPdfs } from '../PDFSegmentation';
import { SegmentationModel } from '../segmentationModel';
import { Db } from 'mongodb';

jest.mock('api/services/tasksmanager/taskManager.ts');

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
  let file: Buffer;

  afterAll(async () => {
    await testingDB.disconnect();
  });

  beforeEach(async () => {
    segmentPdfs = new SegmentPdfs();
    await DB.connect();
    dbOne = DB.connectionForDB(tenantOne.dbName).db;
    dbTwo = DB.connectionForDB(tenantTwo.dbName).db;
    tenants.tenants = { tenantOne };
    file = fs.readFileSync(`app/api/services/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
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

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );
  });

  it('should send 10 pdfs to segment', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesTwelveFiles);
    await segmentPdfs.segmentPdfs();

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledWith(
      file,
      fixturesPdfNameA
    );

    expect(segmentPdfs.segmentationTaskManager?.sendFile).toHaveBeenCalledTimes(10);
  });

  it('should send pdfs only from templates with the information extraction on', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFilesWithtMixedInformationExtraction);

    await segmentPdfs.segmentPdfs();

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

  it('should start the tasks', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

    await segmentPdfs.segmentPdfs();

    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledWith({
      task: 'f2082bf51b6ef839690485d7153e847a.pdf',
      tenant: 'tenant1',
    });
  });

  it('should store the segmentation process state', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

    await segmentPdfs.segmentPdfs();
    await tenants.run(async () => {
      const [segmentation] = await SegmentationModel.get();
      expect(segmentation.status).toBe('pending');
      expect(segmentation.fileName).toBe(fixturesPdfNameA);
      expect(segmentation.fileID).toEqual(fixturesOneFile.files![0]._id);
    }, 'tenantOne');
  });

  //TODO:
  // - precalculate teanants that have the feature toggle on
  // - should only send pdfs not already segmented
  // - should handle tenants without the information extraction on
  // - should get the results from the task and store them
  // - do a load test to checkl the perfomance
  // - make sure onlye one taskmanager is instanced
  // - error handling ? task failed ?
});
