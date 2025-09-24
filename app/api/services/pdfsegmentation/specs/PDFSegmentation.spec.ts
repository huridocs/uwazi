/* eslint-disable max-statements */
/* eslint-disable camelcase */
/* eslint-disable max-lines */


import testingDB, { fixturer } from 'api/utils/testing_db.js';
import {
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesOneHundredFiles,
  fixturesFiveFiles,
  fixturesMissingPdf,
  // @ts-expect-error TS(2307): Cannot find module '../services/pdfsegmentation/sp... Remove this comment to see the full error message
} from '../services/pdfsegmentation/specs/fixtures.js';

// @ts-expect-error TS(2307): Cannot find module '../files.js' or its correspond... Remove this comment to see the full error message
import { storage } from '../files.js';
import path from 'path';

// @ts-expect-error TS(2307): Cannot find module '../tenants/tenantContext.js' o... Remove this comment to see the full error message
import { tenants } from '../tenants/tenantContext.js';
// @ts-expect-error TS(2307): Cannot find module '../odm.js' or its correspondin... Remove this comment to see the full error message
import { DB } from '../odm.js';
import { Db } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import request from 'shared/JSONRequest.js';

// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
// @ts-expect-error TS(2307): Cannot find module '../config.js' or its correspon... Remove this comment to see the full error message
import { config } from '../config.js';
import { PDFSegmentation } from '../PDFSegmentation.js';
import { SegmentationModel } from '../segmentationModel.js';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService.js';

jest.mock('api/services/tasksmanager/TaskManager.ts');

const deleteFolder = async (folderPath: string) => {
  try {
    await fs.rm(folderPath, { recursive: true });
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
};

describe('PDFSegmentation', () => {
  let segmentPdfs: PDFSegmentation;

  const folders = {
    uploadedDocuments: `${__dirname}/uploads`,
    attachments: `${__dirname}/uploads`,
    customUploads: `${__dirname}/uploads`,
    activityLogs: `${__dirname}/uploads`,
  };

  const tenantOne = {
    name: 'tenantOne',
    dbName: 'tenantOne',
    indexName: 'tenantOne',
    ...folders,
  };

  const tenantTwo = {
    name: 'tenantTwo',
    dbName: 'tenantTwo',
    indexName: 'tenantTwo',
    ...folders,
  };

  let dbOne: Db;
  let dbTwo: Db;
  let fileA: Buffer;
  let fileB: Buffer;

  beforeAll(async () => {
    const uri = config.DBHOST;
    await DB.connect(`${uri}PDFSegmentation_spec`);
  });

  afterAll(async () => {
    await DB.disconnect();
  });

  beforeEach(async () => {
    segmentPdfs = new PDFSegmentation();
    dbOne = testingDB.db(tenantOne.dbName);
    dbTwo = testingDB.db(tenantTwo.dbName);

    tenants.tenants = { tenantOne };
    fileA = await fs.readFile(`app/api/services/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    fileB = await fs.readFile(`app/api/services/pdfsegmentation/specs/uploads/${fixturesPdfNameA}`);
    jest.spyOn(request, 'uploadFile').mockResolvedValue({});
    jest.resetAllMocks();
  });

  it('should send the pdf', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

    await segmentPdfs.segmentPdfs();
    expect(request.uploadFile).toHaveBeenCalledWith(
      'http://localhost:1234/files/tenantOne',
      fixturesPdfNameA,
      fileA
    );
  });

  it('should send other pdf to segment', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOtherFile);
    await segmentPdfs.segmentPdfs();
    expect(request.uploadFile).toHaveBeenCalledWith(
      'http://localhost:1234/files/tenantOne',
      fixturesPdfNameB,
      fileB
    );
  });

  it('should send 50 pdfs to segment', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneHundredFiles);
    await segmentPdfs.segmentPdfs();
    expect(request.uploadFile).toHaveBeenCalledTimes(50);
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
      expect(segmentation.status).toBe('processing');
      expect(segmentation.filename).toBe(fixturesPdfNameA);
      expect(segmentation.fileID).toEqual(fixturesOneFile.files![0]._id);
    }, 'tenantOne');
  });

  it('should only send ready pdfs not already segmented or in the process', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
    await dbOne.collection('segmentations').insertMany([
      {
        filename: fixturesFiveFiles.files![0].filename,
        fileID: fixturesFiveFiles.files![0]._id,
        status: 'processing',
      },
    ]);

    await segmentPdfs.segmentPdfs();

    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(4);
  });

  describe('if the file is missing', () => {
    it('should throw an error and store the segmentation as failed', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesMissingPdf);

      await segmentPdfs.segmentPdfs();

      await tenants.run(async () => {
        const segmentations = await SegmentationModel.get();
        const [segmentation] = segmentations;
        expect(segmentation.status).toBe('failed');
        expect(segmentation.filename).toBe(fixturesMissingPdf.files![0].filename);
        expect(segmentations.length).toBe(1);
      }, 'tenantOne');
    });
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
    let segmentationData: {
      page_width: number;
      page_height: number;
      paragraphs: object[];
    };
    let segmentationFolder: string;
    beforeEach(async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);
      await segmentPdfs.segmentPdfs();
      segmentationFolder = path.join(tenantOne.uploadedDocuments, 'segmentation');
      await deleteFolder(segmentationFolder);
      segmentationExternalService = new ExternalDummyService(1235);
      await segmentationExternalService.start();

      segmentationData = {
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
      segmentationExternalService.setFileResults(path.join(__dirname, '/uploads/test.xml'));
    });

    afterEach(async () => {
      await segmentationExternalService.stop();
      await deleteFolder(segmentationFolder);
    });

    it('should store the segmentation', async () => {
      await segmentPdfs.processResults({
        tenant: tenantOne.name,
        params: { filename: 'documentA.pdf' },
        data_url: 'http://localhost:1235/results',
        file_url: 'http://localhost:1235/file',
        task: 'segmentation',
        success: true,
      });

      await tenants.run(async () => {
        const segmentations = await SegmentationModel.get();
        const [segmentation] = segmentations;
        expect(segmentation.status).toBe('ready');
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

    it('should store the xml file', async () => {
      await segmentPdfs.processResults({
        tenant: tenantOne.name,
        params: { filename: 'documentA.pdf' },
        data_url: 'http://localhost:1235/results',
        file_url: 'http://localhost:1235/file',
        task: 'segmentation',
        success: true,
      });
      await tenants.run(async () => {
        const fileContent = await storage.fileContents('segmentation/documentA.xml', 'document');
        const xml = '<description>Cold shrimps soup</description>';
        expect(fileContent.includes(xml)).toBe(true);

        expect(await storage.fileExists('segmentation/documentA.xml', 'document')).toBe(true);
      }, 'tenantOne');
    });

    describe('if the segmentation fails', () => {
      it('should store it as failed', async () => {
        await segmentPdfs.processResults({
          tenant: tenantOne.name,
          params: { filename: 'documentA.pdf' },
          data_url: 'http://localhost:1235/results',
          file_url: 'http://localhost:1235/file',
          task: 'segmentation',
          success: false,
        });

        await tenants.run(async () => {
          const segmentations = await SegmentationModel.get();
          const [segmentation] = segmentations;
          expect(segmentation.status).toBe('failed');
          expect(segmentation.filename).toBe(fixturesPdfNameA);
          expect(segmentation.fileID).toEqual(fixturesOneFile.files![0]._id);
          expect(segmentation.autoexpire).toBe(null);
          expect(segmentations.length).toBe(1);
        }, tenantOne.name);
      });
    });
  });
});
