import { fixturer, createNewMongoDB } from 'api/utils/testing_db';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesTwelveFiles,
  fixturesFiveFiles,
} from 'api/services/pdfsegmentation/specs/fixtures';

import fs from 'fs';

import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { Db } from 'mongodb';
import request from 'shared/JSONRequest';

import { PDFSegmentation } from '../PDFSegmentation';
import { SegmentationModel } from '../segmentationModel';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('PDFSegmentation', () => {
  let segmentPdfs: PDFSegmentation;

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
  let mongod: MongoMemoryServer;

  afterAll(async () => {
    await DB.disconnect();
    await mongod.stop();
  });

  beforeAll(async () => {
    mongod = await createNewMongoDB();
    const mongoUri = mongod.getUri();
    await DB.connect(mongoUri);
  });

  beforeEach(async () => {
    segmentPdfs = new PDFSegmentation();
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
      params: { filename: 'documentA.pdf' },
      tenant: 'tenantOne',
      task: 'segmentation',
    });
  });

  it('should store the segmentation process state', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

    await segmentPdfs.segmentPdfs();
    await tenants.run(async () => {
      const [segmentation] = await SegmentationModel.get();
      expect(segmentation.status).toBe('pending');
      expect(segmentation.filename).toBe(fixturesPdfNameA);
      expect(segmentation.fileID).toEqual(fixturesOneFile.files![0]._id);
    }, 'tenantOne');
  });

  it('should only send pdfs not already segmented or in the process', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
    await dbOne.collection('segmentations').insertMany([
      {
        filename: fixturesFiveFiles.files![0].filename,
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

      segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(10);

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
    let segmentationExternalService: ExternalDummyService;
    beforeEach(async () => {
      segmentationExternalService = new ExternalDummyService(1235);
      await segmentationExternalService.start();
    });

    afterEach(async () => {
      await segmentationExternalService.stop();
    });
    it('should store the segmentation', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);
      const segmentationData = {
        page_width: 600,
        page_height: 1200,
        paragraphs: [
          {
            left: 30,
            top: 45,
            width: 400,
            height: 120,
            page_number: 1,
            text: 'El veloz murciélago hindú comía feliz cardillo y kiwi.',
          },
        ],
      };

      segmentationExternalService.setResults(segmentationData);

      await segmentPdfs.segmentPdfs();

      await segmentPdfs.processResults({
        tenant: tenantOne.name,
        params: { filename: 'documentA.pdf' },
        data_url: 'http://localhost:1235/results',
        task: 'segmentation',
      });

      await tenants.run(async () => {
        const segmentations = await SegmentationModel.get();
        const [segmentation] = segmentations;
        expect(segmentation.status).toBe('completed');
        expect(segmentation.filename).toBe(fixturesPdfNameA);
        expect(segmentation.fileID).toEqual(fixturesOneFile.files![0]._id);
        expect(segmentation.autoexpire).toBe(null);

        expect(segmentation.segmentation).toEqual(
          expect.objectContaining({
            ...segmentationData,
            paragraphs: [expect.objectContaining(segmentationData.paragraphs[0])],
          })
        );
      }, tenantOne.name);
    });
  });
});
