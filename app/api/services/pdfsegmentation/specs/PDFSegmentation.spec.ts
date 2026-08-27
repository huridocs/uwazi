/* eslint-disable max-statements */
/* eslint-disable camelcase */
/* eslint-disable max-lines */

import { testingDB, fixturer } from '#api/utils/testing_db.js';
import {
  fixturesOneFile,
  fixturesOtherFile,
  fixturesPdfNameA,
  fixturesPdfNameB,
  fixturesOneHundredFiles,
  fixturesFiveFiles,
  fixturesMissingPdf,
} from '#api/services/pdfsegmentation/specs/fixtures.js';

import { storage } from '#api/files/index.js';
import path from 'path';

import { tenants } from '#api/tenants/tenantContext.js';
import { DB } from '#api/odm/index.js';
import { Db } from 'mongodb';
import request from '#shared/JSONRequest.js';

// eslint-disable-next-line no-restricted-imports
import fs from 'fs/promises';
import { config } from '#api/config.js';
import { PDFSegmentation } from '../PDFSegmentation.js';
import { SegmentationModel } from '../segmentationModel.js';
import { ExternalDummyService } from '../../tasksmanager/specs/ExternalDummyService.js';
import { MongoFilesDAO } from '#api/core/infrastructure/mongodb/files/MongoFilesDAO.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

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
    domain: 'test-tenant-1',
  };

  const tenantTwo = {
    name: 'tenantTwo',
    dbName: 'tenantTwo',
    indexName: 'tenantTwo',
    ...folders,
    domain: 'test-tenant-2',
  };

  let dbOne: Db;
  let dbTwo: Db;
  let tenantLogger: Logger;

  const logsFor = (logger: Logger, namespace: string) =>
    (logger.info as jest.Mock).mock.calls
      .map(([, metadata]) => metadata)
      .filter(metadata => metadata?.namespace === namespace);

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

    // `LoggerFactory.systemLogger()` has no NODE_ENV=test silencing the way `default()` does, so
    // it would write real log lines through the suite.
    tenantLogger = LoggerFactory.forTests();
    jest.spyOn(LoggerFactory, 'default').mockReturnValue(tenantLogger as any);
    segmentPdfs.systemLogger = LoggerFactory.forTests();
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

  it('should exclude already segmented files by plain string id', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
    await dbOne.collection('segmentations').insertMany([
      {
        filename: fixturesFiveFiles.files![0].filename,
        fileID: fixturesFiveFiles.files![0]._id,
        status: 'processing',
      },
    ]);

    const getByQuery = jest.spyOn(MongoFilesDAO.prototype, 'getByQuery').mockResolvedValue([]);

    await tenants.run(async () => {
      await segmentPdfs.getFilesToSegment();
    }, 'tenantOne');

    // The ids must reach the DAO as primitive strings: `files._id` is TEXT on Postgres tenants
    // and `pg` serialises an ObjectId to a quoted hex string, which matches nothing.
    const excluded = (getByQuery.mock.calls[0][0] as any)._id.$nin;
    expect(excluded).toEqual([fixturesFiveFiles.files![0]._id!.toString()]);
    excluded.forEach((id: unknown) => expect(typeof id).toBe('string'));

    getByQuery.mockRestore();
  });

  describe('bounded concurrency and failure containment', () => {
    it('should dispatch every file in the batch', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      jest.spyOn(request, 'uploadFile').mockResolvedValue({});

      await segmentPdfs.segmentPdfs();

      expect(request.uploadFile).toHaveBeenCalledTimes(5);
    });

    it('should not exceed uploadConcurrency in flight at once', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      segmentPdfs.uploadConcurrency = 2;

      let inFlight = 0;
      let peak = 0;
      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise(resolve => {
          setTimeout(resolve, 5);
        });
        inFlight -= 1;
        return {};
      });

      await segmentPdfs.segmentPdfs();

      expect(request.uploadFile).toHaveBeenCalledTimes(5);
      expect(peak).toBe(2);
    });

    it('should mark a failing file as failed, keep dispatching, and not retry it', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

      // All five fixture files share one filename, so the poison file is keyed on call order.
      let call = 0;
      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        call += 1;
        if (call === 1) {
          throw new Error('segmentation service rejected this pdf');
        }
        return {};
      });

      await segmentPdfs.segmentPdfs();

      // The four files after the failure still went out — a rethrow would have abandoned them.
      expect(request.uploadFile).toHaveBeenCalledTimes(5);

      await tenants.run(async () => {
        expect(await SegmentationModel.get({ status: 'failed' })).toHaveLength(1);
        expect(await SegmentationModel.get({ status: 'processing' })).toHaveLength(4);

        // Without the record the poison file would come back every tick and stall the tenant.
        expect(await segmentPdfs.getFilesToSegment()).toEqual([]);
      }, 'tenantOne');
    });

    it('should not mark files failed when the segmentation service is unreachable', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      const file = fixturesFiveFiles.files![0];

      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        const error: any = new Error('connect ECONNREFUSED');
        error.code = 'ECONNREFUSED';
        throw error;
      });

      // An outage is not the file's fault. Marking it failed would exclude it from every future
      // tick, permanently burning the backlog. `dispatchOnePdf` is exercised directly here because
      // `segmentPdfs` answers ECONNREFUSED with a 60s backoff.
      await tenants.run(async () => {
        await expect(
          segmentPdfs.dispatchOnePdf(
            { _id: file._id!, filename: file.filename! },
            'http://localhost:1234/files',
            'tenantOne'
          )
        ).rejects.toMatchObject({ code: 'ECONNREFUSED' });

        expect(await SegmentationModel.get()).toEqual([]);
      }, 'tenantOne');
    });
  });

  describe('claim-first dispatch', () => {
    it('should write the processing claim before uploading the file', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesOneFile);

      let claimsAtUploadTime: any[] = [];
      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        claimsAtUploadTime = await SegmentationModel.get({});
        return {};
      });

      await segmentPdfs.segmentPdfs();

      expect(claimsAtUploadTime).toHaveLength(1);
      expect(claimsAtUploadTime[0].status).toBe('processing');
    });

    it('should leave exactly one record per file when a dispatch fails', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

      let call = 0;
      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        call += 1;
        if (call === 1) {
          throw new Error('segmentation service rejected this pdf');
        }
        return {};
      });

      await segmentPdfs.segmentPdfs();

      await tenants.run(async () => {
        // The failure path updates the claim rather than inserting a second record; duplicates
        // would silently inflate the exclusion set shipped on every tick.
        const segmentations = await SegmentationModel.get({});
        expect(segmentations).toHaveLength(5);
        expect(segmentations.filter(s => s.status === 'failed')).toHaveLength(1);
      }, 'tenantOne');
    });

    it('should not hand the same files to an overlapping tick', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

      let started = 0;
      let markAllInFlight: () => void;
      let releaseUploads: () => void;
      const allInFlight = new Promise<void>(resolve => {
        markAllInFlight = resolve;
      });
      const gate = new Promise<void>(resolve => {
        releaseUploads = resolve;
      });

      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        started += 1;
        if (started === 5) {
          markAllInFlight!();
        }
        await gate;
        return {};
      });

      const firstTick = segmentPdfs.segmentPdfs();
      await allInFlight;

      // A second worker ticking while the first is mid-dispatch must see nothing left to do.
      // Before claim-first, `storeProcess` ran after `startTask`, so these files were still
      // unclaimed here and would have been dispatched a second time.
      let filesForOverlappingTick: { filename: string }[] = [];
      await tenants.run(async () => {
        filesForOverlappingTick = await segmentPdfs.getFilesToSegment();
      }, 'tenantOne');
      expect(filesForOverlappingTick).toEqual([]);

      releaseUploads!();
      await firstTick;

      expect(request.uploadFile).toHaveBeenCalledTimes(5);
    });
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
    const withPendingTasks = (pending: number) => {
      segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(pending);
    };

    it('should keep the queue topped up while it is below the target depth', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      segmentPdfs.targetQueueDepth = 200;
      withPendingTasks(10);

      await segmentPdfs.segmentPdfs();

      // Previously any pending task at all suppressed the tick, which left the segmentation
      // service idle between batches.
      expect(segmentPdfs.segmentationTaskManager?.startTask).toHaveBeenCalledTimes(5);
    });

    it('should not put more once the target depth is reached', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      segmentPdfs.targetQueueDepth = 200;
      withPendingTasks(200);

      await segmentPdfs.segmentPdfs();

      expect(segmentPdfs.segmentationTaskManager?.startTask).not.toHaveBeenCalled();
    });

    it('should not put more above the target depth', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      segmentPdfs.targetQueueDepth = 200;
      withPendingTasks(201);

      await segmentPdfs.segmentPdfs();

      expect(segmentPdfs.segmentationTaskManager?.startTask).not.toHaveBeenCalled();
    });
  });

  describe('tunable throughput settings', () => {
    it('should default batch size, queue depth and upload concurrency', () => {
      expect(segmentPdfs.batchSize).toBe(50);
      expect(segmentPdfs.targetQueueDepth).toBe(200);
      expect(segmentPdfs.uploadConcurrency).toBe(5);
    });

    it('should cap a tenant at batchSize per tick regardless of queue depth', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesOneHundredFiles);
      segmentPdfs.batchSize = 3;
      segmentPdfs.targetQueueDepth = 200;

      await segmentPdfs.segmentPdfs();

      // Depth decides *whether* to refill; batchSize decides *how much*. Both must rise together.
      expect(request.uploadFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('observability', () => {
    it('should report a skipped tick without dispatching', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      segmentPdfs.targetQueueDepth = 200;
      segmentPdfs.segmentationTaskManager!.countPendingTasks = async () => Promise.resolve(250);

      await segmentPdfs.segmentPdfs();

      const [tick] = logsFor(segmentPdfs.systemLogger, 'Segmentation_Tick');
      expect(tick).toMatchObject({
        skipped: true,
        success: true,
        pendingTasks: 250,
        targetQueueDepth: 200,
        tenantsProcessed: 0,
      });
      expect(tick.durationMs).toEqual(expect.any(Number));
      expect(request.uploadFile).not.toHaveBeenCalled();
    });

    it('should report a completed tick with the tenants it processed', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

      await segmentPdfs.segmentPdfs();

      const [tick] = logsFor(segmentPdfs.systemLogger, 'Segmentation_Tick');
      expect(tick).toMatchObject({ skipped: false, success: true, tenantsProcessed: 1 });
    });

    it('should report the dispatched and failed counts for a batch', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);

      let call = 0;
      jest.spyOn(request, 'uploadFile').mockImplementation(async () => {
        call += 1;
        if (call === 1) {
          throw new Error('segmentation service rejected this pdf');
        }
        return {};
      });

      await segmentPdfs.segmentPdfs();

      const [dispatch] = logsFor(tenantLogger, 'Segmentation_Dispatch');
      expect(dispatch).toMatchObject({
        dispatched: 4,
        failed: 1,
        batchSize: 50,
        uploadConcurrency: 5,
      });
    });

    it('should report each failed file with a groupable error name', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesMissingPdf);

      await segmentPdfs.segmentPdfs();

      const [failure] = logsFor(tenantLogger, 'Segmentation_File_Failed');
      expect(failure).toMatchObject({
        success: false,
        filename: fixturesMissingPdf.files![0].filename,
        errorName: 'FileNotFound',
      });
      expect(failure.fileId).toBe(fixturesMissingPdf.files![0]._id!.toString());
    });

    it('should report the exclusion set size and query cost', async () => {
      await fixturer.clearAllAndLoad(dbOne, fixturesFiveFiles);
      await dbOne.collection('segmentations').insertMany([
        {
          filename: fixturesFiveFiles.files![0].filename,
          fileID: fixturesFiveFiles.files![0]._id,
          status: 'processing',
        },
      ]);

      await segmentPdfs.segmentPdfs();

      const [query] = logsFor(tenantLogger, 'Segmentation_Query');
      expect(query).toMatchObject({ exclusionSetSize: 1, candidatesFound: 4 });
      expect(query.durationMs).toEqual(expect.any(Number));
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
