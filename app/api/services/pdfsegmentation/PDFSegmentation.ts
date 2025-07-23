import { storage, uploadsPath } from 'api/files';
import { FileNotFound } from 'api/files/FileNotFound';
import { filesModel } from 'api/files/filesModel';
import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { handleError } from 'api/utils';
import path from 'path';
import request from 'shared/JSONRequest';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import { SegmentationType } from 'shared/types/segmentationType';
import { Settings } from 'shared/types/settingsType';
import { Readable } from 'stream';
import urljoin from 'url-join';
import { SegmentationModel } from './segmentationModel';

class PDFSegmentation {
  static SERVICE_NAME = 'segmentation';
  static MAX_RETRY_COUNT = 3;

  public segmentationTaskManager: TaskManager;

  features: Settings | undefined;

  batchSize = 50;

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
    try {
      const fileContent = await storage.fileContents(file.filename, 'document');
      await request.uploadFile(urljoin(serviceUrl, tenant), file.filename, fileContent);

      await this.segmentationTaskManager.startTask({
        task: PDFSegmentation.SERVICE_NAME,
        tenant,
        params: {
          filename: file.filename,
        },
      });

      await this.storeProcess(file._id, file.filename);
    } catch (err) {
      if (err instanceof FileNotFound) {
        await this.storeProcess(file._id, file.filename, false);
        handleError(err);
        return;
      }

      throw err;
    }
  };

  storeProcess = async (fileID: ObjectIdSchema, filename: string, processing = true) => {
    const [existingSegmentation] = await SegmentationModel.get({ fileID });

    if (existingSegmentation) {
      if (
        existingSegmentation.status === 'failed' &&
        (existingSegmentation.retryCount || 0) >= PDFSegmentation.MAX_RETRY_COUNT
      ) {
        return;
      }
      await SegmentationModel.save({
        ...existingSegmentation,
        status: processing ? 'processing' : 'failed',
        retryCount: processing ? 0 : (existingSegmentation.retryCount || 0) + 1,
      });
    } else {
      await SegmentationModel.save({
        fileID,
        filename,
        status: processing ? 'processing' : 'failed',
        retryCount: processing ? 0 : 1,
      });
    }
  };

  getFilesToSegment = async (): Promise<{ filename: string; _id: ObjectIdSchema }[]> => {
    const segmentations = (await SegmentationModel.get({
      fileID: { $exists: true },
    })) as SegmentationType[];

    const successfullySegmentedFiles = segmentations
      .filter(segmentation => segmentation.status === 'ready')
      .map(segmentation => segmentation.fileID);

    const processingFiles = segmentations
      .filter(segmentation => segmentation.status === 'processing')
      .map(segmentation => segmentation.fileID);

    const permanentlyFailedSegmentedFiles = segmentations
      .filter(
        segmentation =>
          segmentation.status === 'failed' &&
          (segmentation.retryCount || 0) >= PDFSegmentation.MAX_RETRY_COUNT
      )
      .map(segmentation => segmentation.fileID);

    const retryableFailedSegmentations = segmentations.filter(
      segmentation =>
        segmentation.status === 'failed' &&
        (segmentation.retryCount || 0) < PDFSegmentation.MAX_RETRY_COUNT
    );

    const files = (await filesModel.get(
      {
        type: 'document',
        filename: { $exists: true },
        status: 'ready',
        _id: {
          $nin: [
            ...successfullySegmentedFiles,
            ...processingFiles,
            ...permanentlyFailedSegmentedFiles,
          ],
        },
      },
      'filename',
      { limit: this.batchSize }
    )) as (FileType & { filename: string; _id: ObjectIdSchema })[];

    const allFilesToProcess = [
      ...files.map(file => ({ _id: file._id, filename: file.filename })),
      ...retryableFailedSegmentations
        .filter(
          segmentation =>
            segmentation.fileID &&
            segmentation.filename &&
            !processingFiles.includes(segmentation.fileID)
        )
        .map(segmentation => ({
          _id: segmentation.fileID!,
          filename: segmentation.filename!,
          status: segmentation.status,
          retryCount: segmentation.retryCount,
        })),
    ];

    return allFilesToProcess;
  };

  segmentPdfs = async () => {
    const pendingTasks = await this.segmentationTaskManager.countPendingTasks();
    if (pendingTasks > 0) {
      return;
    }

    try {
      await Promise.all(
        Object.keys(tenants.tenants).map(async tenant => {
          await tenants.run(async () => {
            const settingsValues = await settings.get();
            const segmentationServiceConfig = settingsValues?.features?.segmentation;

            if (!segmentationServiceConfig) {
              return;
            }

            const filesToSegment = await this.getFilesToSegment();
            for (let i = 0; i < filesToSegment.length; i += 1) {
              // eslint-disable-next-line no-await-in-loop
              await this.segmentOnePdf(filesToSegment[i], segmentationServiceConfig.url, tenant);
            }
          }, tenant);
        })
      );
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        await new Promise(resolve => {
          setTimeout(resolve, 60000);
        });
      }
      handleError(err, { useContext: false });
    }
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
      const currentRetryCount = segmentation.retryCount || 0;
      await SegmentationModel.save({
        ...segmentation,
        filename,
        autoexpire: null,
        status: 'failed',
        retryCount: currentRetryCount + 1,
      });
    }
  };

  processResults = async (message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      try {
        if (!message.success) {
          await this.saveSegmentationError(message.params?.filename);
          return;
        }

        const { data, fileStream } = await this.requestResults(message);
        await this.storeXML(message.params!.filename, fileStream);
        await this.saveSegmentation(message.params!.filename, data);
      } catch (error) {
        handleError(error);
      }
    }, message.tenant);
  };
}

export { PDFSegmentation };
