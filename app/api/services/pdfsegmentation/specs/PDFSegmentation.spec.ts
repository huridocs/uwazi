/* eslint-disable max-statements */
/* eslint-disable camelcase */
/* eslint-disable max-lines */

import testingDB, { fixturer } from 'api/utils/testing_db';
import {
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesOneHundredFiles,
  fixturesFiveFiles,
  fixturesMissingPdf,
  fixturesWithFailedSegmentations,
} from 'api/services/pdfsegmentation/specs/fixtures';

import { storage } from 'api/files';
import path from 'path';

import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { Db } from 'mongodb';
import request from 'shared/JSONRequest';

// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { config } from 'api/config';
import { PDFSegmentation } from '../PDFSegmentation';
import { SegmentationModel } from '../segmentationModel';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService';

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

    // With batch size 50, should process 4 files: 3 ready files (F2, F3, F4, F5) + 1 failed file (F6) for retry
    // The processing file (F1) is excluded
    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(4);
  });

  it('should retry failed segmentations', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesWithFailedSegmentations);

    await dbOne.collection('segmentations').insertMany([
      {
        _id: testingDB.id(),
        fileID: fixturesWithFailedSegmentations.files![0]._id,
        filename: 'document1.pdf',
        status: 'failed',
      },
      {
        _id: testingDB.id(),
        fileID: fixturesWithFailedSegmentations.files![1]._id,
        filename: 'document2.pdf',
        status: 'ready',
      },
    ]);

    segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(0);

    await segmentPdfs.segmentPdfs();

    // Since the files don't exist in storage, they should be marked as failed
    // The startTask should not be called because the files are not found
    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(0);

    // Verify that the failed segmentation records were deleted and new failed ones were created
    await tenants.run(async () => {
      const segmentations = await SegmentationModel.get();

      // Should have segmentations for the files that were processed
      expect(segmentations.length).toBeGreaterThanOrEqual(2);

      // Should have failed segmentations for the files that don't exist
      const failedSegmentations = segmentations.filter(s => s.status === 'failed');
      expect(failedSegmentations.length).toBeGreaterThanOrEqual(2);

      // Should have the original successful segmentation
      const successfulSegmentations = segmentations.filter(s => s.status === 'ready');
      expect(successfulSegmentations.length).toBeGreaterThanOrEqual(1);
    }, 'tenantOne');
  });

  it('should retry failed segmentations with existing files', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

    await dbOne.collection('segmentations').insertMany([
      {
        _id: testingDB.id(),
        fileID: fixturesFiveFiles.files![0]._id,
        filename: fixturesFiveFiles.files![0].filename,
        status: 'failed',
      },
      {
        _id: testingDB.id(),
        fileID: fixturesFiveFiles.files![1]._id,
        filename: fixturesFiveFiles.files![1].filename,
        status: 'ready',
      },
    ]);

    segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(0);

    await segmentPdfs.segmentPdfs();

    // With batch size 50, should process 5 files: 2 failed files for retry (F1 + F6) + 3 new files (F3, F4, F5)
    // The ready file (F2) should be excluded
    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(5);

    // Verify that the failed segmentation records were deleted
    await tenants.run(async () => {
      const segmentations = await SegmentationModel.get();

      // Should have segmentations for the files that were processed
      expect(segmentations.length).toBeGreaterThanOrEqual(5);

      // Should not have any failed segmentations (they were deleted for retry)
      const failedSegmentations = segmentations.filter(s => s.status === 'failed');
      expect(failedSegmentations.length).toBe(0);

      // Should have the original successful segmentation
      const successfulSegmentations = segmentations.filter(s => s.status === 'ready');
      expect(successfulSegmentations.length).toBeGreaterThanOrEqual(1);
    }, 'tenantOne');
  });

  it('should not retry failed segmentations that have exceeded the retry limit', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

    // Insert a segmentation that has exceeded the retry limit
    await dbOne.collection('segmentations').insertMany([
      {
        _id: testingDB.id(),
        fileID: fixturesFiveFiles.files![0]._id,
        filename: fixturesFiveFiles.files![0].filename,
        status: 'failed',
        retryCount: 3, // Max retry count reached
      },
      {
        _id: testingDB.id(),
        fileID: fixturesFiveFiles.files![1]._id,
        filename: fixturesFiveFiles.files![1].filename,
        status: 'ready',
      },
    ]);

    segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(0);

    await segmentPdfs.segmentPdfs();

    // Should process 3 files: 3 ready files (F3, F4, F5)
    // The maxed-out failed file and the ready file should be excluded
    expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(3);

    // Verify that the maxed-out failed segmentation was not processed
    await tenants.run(async () => {
      const segmentations = await SegmentationModel.get();

      // Should have the maxed-out failed segmentation still present (unchanged)
      const maxedOutFailedSegmentations = segmentations.filter(
        s => s.status === 'failed' && s.retryCount === 3
      );
      expect(maxedOutFailedSegmentations.length).toBe(1);

      // Should have the original successful segmentation
      const successfulSegmentations = segmentations.filter(s => s.status === 'ready');
      expect(successfulSegmentations.length).toBeGreaterThanOrEqual(1);
    }, 'tenantOne');
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
          expect(segmentation.retryCount).toBe(1);
          expect(segmentations.length).toBe(1);
        }, tenantOne.name);
      });

      it('should increment retry count on subsequent failures', async () => {
        await segmentPdfs.processResults({
          tenant: tenantOne.name,
          params: { filename: 'documentA.pdf' },
          data_url: 'http://localhost:1235/results',
          file_url: 'http://localhost:1235/file',
          task: 'segmentation',
          success: false,
        });

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
          expect(segmentation.retryCount).toBe(2);
          expect(segmentations.length).toBe(1);
        }, tenantOne.name);
      });

      it('should not create duplicate entries when retrying failed segmentations', async () => {
        await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

        await tenants.run(async () => {
          await SegmentationModel.save({
            fileID: fixturesOneFile.files![0]._id,
            filename: fixturesOneFile.files![0].filename,
            status: 'failed',
            retryCount: 0,
          });
        }, 'tenantOne');

        // Now run segmentation to retry the failed file
        segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(0);
        await segmentPdfs.segmentPdfs();

        await tenants.run(async () => {
          const segmentations = await SegmentationModel.get();

          // Should have exactly one segmentation entry
          expect(segmentations.length).toBe(1);

          // Should be in processing status
          expect(segmentations[0].status).toBe('processing');
          expect(segmentations[0].filename).toBe(fixturesOneFile.files![0].filename);
        }, 'tenantOne');
      });
    });
  });
});
