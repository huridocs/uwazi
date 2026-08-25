/* eslint-disable max-lines */
/* eslint-disable max-statements */
import path from 'path';
import { Readable } from 'stream';
import urljoin from 'url-join';
import { storage, uploadsPath } from '#api/files/index.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { ResultsMessage, TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import settings from '#api/settings/settings.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { handleError } from '#api/utils/index.js';
import request from '#shared/JSONRequest.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { FileType } from '#shared/types/fileType.js';
import { SegmentationType } from '#shared/types/segmentationType.js';
import { Settings } from '#shared/types/settingsType.js';
import { SegmentationModel } from './segmentationModel.js';

class PDFSegmentation {
  static SERVICE_NAME = 'segmentation';

  public segmentationTaskManager: TaskManager;

  features: Settings | undefined;

  batchSize = Number(process.env.SEGMENTATION_BATCH_SIZE) || 50;

  targetQueueDepth = Number(process.env.SEGMENTATION_QUEUE_DEPTH) || 200;

  uploadConcurrency = Number(process.env.SEGMENTATION_UPLOAD_CONCURRENCY) || 5;

  /** Tick-level events have no tenant; per-tenant events build their logger inside the context. */
  systemLogger: Logger = LoggerFactory.systemLogger();

  constructor() {
    this.segmentationTaskManager = new TaskManager({
      serviceName: PDFSegmentation.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  start() {
    this.segmentationTaskManager.subscribeToResults();
  }

  async stop() {
    await this.segmentationTaskManager.stop();
  }

  segmentOnePdf = async (
    file: { filename: string; _id: ObjectIdSchema },
    serviceUrl: string,
    tenant: string
  ) => {
    // Claim the file before doing any work. `storeProcess` used to run *after* `startTask`,
    // leaving a window in which a concurrently running worker's `getFilesToSegment` could select
    // the same rows and dispatch them twice. Two `app/worker.js` replicas run in both staging and
    // production, and `DistributedLoop`'s redlock lease (`maxLockTime + delayTimeBetweenTasks`) is
    // never extended, so it expires mid-tick and does not prevent the overlap on its own. The
    // exclusion record is the dispatch marker, which closes the window regardless of the lock.
    //
    // A crash between the claim and the dispatch leaves a stranded `processing` record, but the
    // model's 24h `autoexpire` TTL clears it and the file is picked up again.
    await this.storeProcess(file._id, file.filename);

    const fileContent = await storage.fileContents(file.filename, 'document');
    await request.uploadFile(urljoin(serviceUrl, tenant), file.filename, fileContent);

    await this.segmentationTaskManager.startTask({
      task: PDFSegmentation.SERVICE_NAME,
      tenant,
      params: {
        filename: file.filename,
      },
    });
  };

  /**
   * Contains per-file failures so one bad file cannot stall a tenant's whole backlog, and reports
   * each one. Returns whether the file was dispatched, which feeds the per-tenant counts.
   *
   * A rethrow out of `segmentOnePdf` would mean `storeProcess` never records an outcome, so the
   * file comes back from `getFilesToSegment` on the very next tick, in the same position, and
   * fails again — a single PDF the segmentation service reliably rejects would block that tenant
   * indefinitely. Recording it as `failed` is what un-sticks it: the record excludes it from the
   * next query. `FileNotFound` runs through this same path rather than a separate branch inside
   * `segmentOnePdf`, so every failure is counted and logged once, in one place.
   *
   * `ECONNREFUSED` is deliberately *not* contained. It means the segmentation service is down, not
   * that this file is bad, and marking files failed in that state would exclude every file
   * dispatched during the outage until the 24h `autoexpire` TTL brings it back — a day of drain
   * progress lost per outage. Rethrowing preserves the existing behaviour in `segmentPdfs`, which
   * backs off for 60s on exactly this code.
   */
  dispatchOnePdf = async (
    file: { filename: string; _id: ObjectIdSchema },
    serviceUrl: string,
    tenant: string
  ): Promise<boolean> => {
    const start = Date.now();

    try {
      await this.segmentOnePdf(file, serviceUrl, tenant);
      return true;
    } catch (err) {
      if (err?.code === 'ECONNREFUSED') {
        // The claim was written before the upload was attempted, so it has to be dropped again —
        // otherwise the file stays excluded from `getFilesToSegment` until the TTL expires it.
        await this.releaseClaim(file._id);
        throw err;
      }

      handleError(err);
      await this.markFailed(file);

      // errorName, not the message: it has to be low-cardinality enough to group on.
      LoggerFactory.default().info(`Segmentation dispatch failed: ${err?.message}`, {
        namespace: 'Segmentation_File_Failed',
        success: false,
        fileId: String(file._id),
        filename: file.filename,
        errorName: err?.constructor?.name ?? 'Unknown',
        durationMs: Date.now() - start,
      });

      return false;
    }
  };

  /**
   * Claims a file, or updates the claim already held for it.
   *
   * Because the claim is now written before the work rather than after it, the failure paths run
   * with a record already in place. Looking it up and reusing its `_id` makes this an update
   * instead of a second insert — duplicate records would otherwise pile up and silently inflate
   * the exclusion set that `getFilesToSegment` ships on every tick.
   */
  storeProcess = async (fileID: ObjectIdSchema, filename: string, processing = true) => {
    const [claim] = await SegmentationModel.get({ fileID });

    return SegmentationModel.save({
      ...(claim ? { _id: claim._id } : {}),
      fileID,
      filename,
      status: processing ? 'processing' : 'failed',
    });
  };

  /**
   * Drops a claim so the file is picked up again on a later tick.
   *
   * Swallows its own errors: both callers are already handling a failure, and neither can afford
   * a second one to displace the original.
   */
  releaseClaim = async (fileID: ObjectIdSchema) => {
    try {
      await SegmentationModel.delete({ fileID });
    } catch (error) {
      handleError(error);
    }
  };

  /** Records a dispatch failure against the existing claim. Swallows its own errors. */
  markFailed = async (file: { filename: string; _id: ObjectIdSchema }) => {
    try {
      await this.storeProcess(file._id, file.filename, false);
    } catch (error) {
      handleError(error);
    }
  };

  getFilesToSegment = async (): Promise<{ filename: string; _id: ObjectIdSchema }[]> => {
    const segmentations = (await SegmentationModel.get(
      { fileID: { $exists: true } },
      'fileID'
    )) as (SegmentationType & { fileID: string })[];

    // `files._id` is TEXT on Postgres tenants and `pg` serialises an ObjectId through
    // JSON.stringify, yielding a hex string *with the quote characters included*, so `$nin` has
    // never excluded anything there. Mongo tenants were never affected.
    // Falsy ids are dropped before the coercion, not after: `String(undefined)` is the truthy
    // string 'undefined', and a null element makes `NOT (x = ANY(arr))` evaluate to NULL once
    // the exclusion list is sent as a single array parameter, which silently drops every row.
    const segmentedFiles = segmentations
      .filter(segmentation => segmentation.fileID)
      .map(segmentation => String(segmentation.fileID));

    const start = Date.now();
    const dao = FilesDAOFactory.default();
    const files = (await dao.getByQuery(
      {
        type: 'document',
        status: 'ready',
        _id: { $nin: segmentedFiles },
      },
      {
        projection: { filename: 1 },
        limit: this.batchSize,
      }
    )) as (FileType & { filename: string; _id: ObjectIdSchema })[];

    // exclusionSetSize is the backlog burn-down curve, and its durationMs is the tuning ceiling:
    // this query costs more as the exclusion set grows, and every throughput increase pays it
    // more often.
    LoggerFactory.default().info('Segmentation candidates queried', {
      namespace: 'Segmentation_Query',
      success: true,
      exclusionSetSize: segmentedFiles.length,
      candidatesFound: files.length,
      durationMs: Date.now() - start,
    });

    return files.map(file => ({ _id: file._id, filename: file.filename }));
  };

  segmentPdfs = async () => {
    // Refill towards a target depth rather than waiting for the queue to drain completely.
    // Waiting for empty made the pipeline bursty: dispatch a batch, then idle until the
    // segmentation service had consumed every task and the next tick came round.
    //
    // `batchSize` still caps how much each tenant contributes per tick, so both have to rise
    // together to drain a large backlog — depth decides *whether* to refill, `batchSize` decides
    // *how much*. Note the gate is evaluated once, before the tenant loop, so the worst case is
    // `targetQueueDepth + (tenants x batchSize)`.
    //
    // Safe against duplicate dispatch because `segmentOnePdf` claims each file before uploading
    // it, so files in flight are already excluded from `getFilesToSegment`.
    const start = Date.now();
    const pendingTasks = await this.segmentationTaskManager.countPendingTasks();

    if (pendingTasks >= this.targetQueueDepth) {
      // The skipped/dispatched ratio is the tuning dial: mostly skipped means raise the queue
      // depth, never skipped means the worker is the limiter and batchSize should rise instead.
      this.logTick({ skipped: true, pendingTasks, tenantsProcessed: 0, start, success: true });
      return;
    }

    let tenantsProcessed = 0;

    try {
      await Promise.all(
        Object.keys(tenants.tenants).map(async tenant => {
          await tenants.run(async () => {
            const settingsValues = await settings.get();
            const segmentationServiceConfig = settingsValues?.features?.segmentation;

            if (!segmentationServiceConfig) {
              return;
            }

            tenantsProcessed += 1;
            const tenantStart = Date.now();
            const filesToSegment = await this.getFilesToSegment();

            // Every step of a dispatch is network-bound, so a sequential loop spends the whole
            // tick waiting. Batches stay bounded: an unbounded Promise.all over a raised
            // batchSize would open hundreds of simultaneous S3 reads and uploads.
            const outcomes = await ArrayUtils.runInBatches(
              { array: filesToSegment, batchSize: this.uploadConcurrency },
              async file => this.dispatchOnePdf(file, segmentationServiceConfig.url, tenant)
            );

            const dispatched = outcomes.filter(Boolean).length;
            LoggerFactory.default().info('Segmentation batch dispatched', {
              namespace: 'Segmentation_Dispatch',
              success: true,
              dispatched,
              failed: outcomes.length - dispatched,
              batchSize: this.batchSize,
              uploadConcurrency: this.uploadConcurrency,
              durationMs: Date.now() - tenantStart,
            });
          }, tenant);
        })
      );
    } catch (err) {
      this.logTick({
        skipped: false,
        pendingTasks,
        tenantsProcessed,
        start,
        success: false,
        errorName: err?.constructor?.name ?? 'Unknown',
      });

      if (err.code === 'ECONNREFUSED') {
        await new Promise(resolve => {
          setTimeout(resolve, 60000);
        });
      }
      handleError(err, { useContext: false });
      return;
    }

    this.logTick({ skipped: false, pendingTasks, tenantsProcessed, start, success: true });
  };

  private logTick = ({
    skipped,
    pendingTasks,
    tenantsProcessed,
    start,
    success,
    errorName,
  }: {
    skipped: boolean;
    pendingTasks: number;
    tenantsProcessed: number;
    start: number;
    success: boolean;
    errorName?: string;
  }) => {
    this.systemLogger.info(skipped ? 'Segmentation tick skipped' : 'Segmentation tick completed', {
      namespace: 'Segmentation_Tick',
      success,
      skipped,
      pendingTasks,
      targetQueueDepth: this.targetQueueDepth,
      tenantsProcessed,
      durationMs: Date.now() - start,
      ...(errorName ? { errorName } : {}),
    });
  };

  requestResults = async (message: ResultsMessage) => {
    const response = await request.get(message.data_url);
    const fileStream = (await fetch(message.file_url!)).body;

    if (!fileStream) {
      throw new Error(
        `Error requesting for segmentation file: ${message.params!.filename}, tenant: ${
          message.tenant
        }`
      );
    }
    return { data: JSON.parse(response.json), fileStream: fileStream as unknown as Readable };
  };

  static getXMLNAme = (filename: string) =>
    `${path.basename(filename, path.extname(filename))}.xml`;

  storeXML = async (filename: string, fileStream: Readable) => {
    await storage.createDirectory(uploadsPath(PDFSegmentation.SERVICE_NAME));
    const xmlname = PDFSegmentation.getXMLNAme(filename);
    await storage.storeFile(xmlname, fileStream, 'segmentation');
  };

  saveSegmentation = async (filename: string, data: any) => {
    const [segmentation] = await SegmentationModel.get({ filename });
    // eslint-disable-next-line camelcase
    const { paragraphs, page_height, page_width } = data;
    await SegmentationModel.save({
      ...segmentation,
      // eslint-disable-next-line camelcase
      segmentation: { page_height, page_width, paragraphs },
      autoexpire: null,
      xmlname: PDFSegmentation.getXMLNAme(filename),
      status: 'ready',
    });
  };

  saveSegmentationError = async (filename: string) => {
    const [segmentation] = await SegmentationModel.get({ filename });
    if (segmentation) {
      await SegmentationModel.save({
        ...segmentation,
        filename,
        autoexpire: null,
        status: 'failed',
      });
    }
  };

  processResults = async (message: ResultsMessage): Promise<void> => {
    const start = Date.now();

    await tenants.run(async () => {
      // Completion rate. Compared against Segmentation_Dispatch it shows whether the segmentation
      // service is keeping up with the worker or falling behind it.
      const logResult = (success: boolean, errorName?: string) =>
        LoggerFactory.default().info('Segmentation result processed', {
          namespace: 'Segmentation_Result',
          success,
          durationMs: Date.now() - start,
          ...(errorName ? { errorName } : {}),
        });

      try {
        if (!message.success) {
          await this.saveSegmentationError(message.params?.filename);
          logResult(false, 'SegmentationServiceFailure');
          return;
        }

        const { data, fileStream } = await this.requestResults(message);
        await this.storeXML(message.params!.filename, fileStream);
        await this.saveSegmentation(message.params!.filename, data);
        logResult(true);
      } catch (error) {
        logResult(false, error?.constructor?.name ?? 'Unknown');
        handleError(error);
      }
    }, message.tenant);
  };
}

export { PDFSegmentation };
