import { testingDB, fixturer } from 'api/utils/testing_db';
import {
  fixturesFilesWithtMixedInformationExtraction,
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesTwelveFiles,
  fixturesFiveFiles,
} from 'api/services/pdfsegmentation/specs/fixtures';

import fs from 'fs';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { Db } from 'mongodb';

import { SegmentPdfs } from '../PDFSegmentation';
import { SegmentationModel } from '../segmentationModel';
import request from 'shared/JSONRequest';
import exp from 'constants';

jest.mock('api/services/tasksmanager/TaskManager.ts');

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
  let fileA: Buffer;
  let fileB: Buffer;

  afterAll(async () => {
    await testingDB.disconnect();
  });

  beforeEach(async () => {
    segmentPdfs = new SegmentPdfs();
    await DB.connect();
    dbOne = DB.connectionForDB(tenantOne.dbName).db;
    dbTwo = DB.connectionForDB(tenantTwo.dbName).db;
    tenants.tenants = { tenantOne };
    fileA = fs.readFileSync(`app/api/services/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    fileB = fs.readFileSync(`app/api/services/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    jest.spyOn(request, 'uploadFile').mockResolvedValue({});
    jest.resetAllMocks();
  });

  it('should send the pdf', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

    await segmentPdfs.segmentPdfs();
    expect(request.uploadFile).toHaveBeenCalledWith(
      'http://localhost:1234/files',
      fixturesPdfNameA,
      fileA
    );
  });

  it('should send other pdf to segment', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOtherFile);

    await segmentPdfs.segmentPdfs();

    await segmentPdfs.segmentPdfs();
    expect(request.uploadFile).toHaveBeenCalledWith(
      'http://localhost:1234/files',
      fixturesPdfNameB,
      fileB
    );
  });

  it('should send 10 pdfs to segment', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesTwelveFiles);
    await segmentPdfs.segmentPdfs();

    expect(request.uploadFile).toHaveBeenCalledWith(
      'http://localhost:1234/files',
      fixturesPdfNameA,
      fileA
    );

    expect(request.uploadFile).toHaveBeenCalledTimes(10);
  });

  it('should send pdfs only from templates with the information extraction on', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFilesWithtMixedInformationExtraction);

    await segmentPdfs.segmentPdfs();

    expect(request.uploadFile).toHaveBeenCalledTimes(2);
  });

  it('should send pdfs from different tenants with the information extraction on', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);
    await fixturer.clearAllAndLoad(dbTwo, fixturesOtherFile);
    tenants.tenants = { tenantOne, tenantTwo };

    await segmentPdfs.segmentPdfs();

    expect(request.uploadFile).toHaveBeenCalledTimes(2);
  });

  it('should start the tasks', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

    await segmentPdfs.segmentPdfs();

    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledWith({
      task: 'documentA.pdf',
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

  it('should only send pdfs not already segmented or in the process', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
    await dbOne.collection('segmentation').insertMany([
      {
        fileName: fixturesFiveFiles,
        fileID: fixturesFiveFiles.files![0]._id,
        status: 'pending',
      },
    ]);

    await segmentPdfs.segmentPdfs();

    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(4);
  });

  describe('when there is pending tasks', () => {
    it('should not put more', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      segmentPdfs.start();

      segmentPdfs.segmentationTaskManager!.countPendingTasks = () => Promise.resolve(10);

      await segmentPdfs.segmentPdfs();

      expect(segmentPdfs.segmentationTaskManager?.startTask).not.toHaveBeenCalled();
    });
  });

  describe('when there is NOT segmentation config', () => {
    it('should do nothing', async () => {
      await fixturer.clearAllAndLoad(dbOne, { ...fixturesOneFile, settings: [{}] });
      await segmentPdfs.segmentPdfs();

      expect(segmentPdfs.segmentationTaskManager?.startTask).not.toHaveBeenCalled();
    });
  });

  describe('when the segmentation finsihes', () => {
    it('should store the segmentation', () => {
      throw new Error('Not implemented');
    });
  });

  //TODO:
  // - do a load test to checkl the perfomance: Tested in Cejil with 5k files and Plan with 25k and took 0.2s to do an aggregation query
  // - error handling ? task failed ?
});
