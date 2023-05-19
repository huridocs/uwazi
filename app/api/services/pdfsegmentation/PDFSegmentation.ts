import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath, storage } from 'api/files';
import { Readable } from 'stream';
import urljoin from 'url-join';
import { filesModel } from 'api/files/filesModel';
import path from 'path';
import { Settings } from 'shared/types/settingsType';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import request from 'shared/JSONRequest';
import { handleError } from 'api/utils';
import { SegmentationType } from 'shared/types/segmentationType';
import { FileType } from 'shared/types/fileType';
import { SegmentationModel } from './segmentationModel';

class PDFSegmentation {
  static SERVICE_NAME = 'segmentation';

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
      if (err.code === 'ENOENT') {
        await this.storeProcess(file._id, file.filename, false);
        handleError(err);
        return;
      }

      throw err;
    }
  };

  storeProcess = async (fileID: ObjectIdSchema, filename: string, processing = true) =>
    SegmentationModel.save({
      fileID,
      filename,
      status: processing ? 'processing' : 'failed',
    });

  getFilesToSegment = async (): Promise<{ filename: string; _id: ObjectIdSchema }[]> => {
    const segmentations = (await SegmentationModel.get(
      { fileID: { $exists: true } },
      'fileID'
    )) as (SegmentationType & { fileID: string })[];

    const segmentedFiles = segmentations.map(segmentation => segmentation.fileID);

    const files = (await filesModel.get(
      {
        type: 'document',
        filename: { $exists: true },
        _id: { $nin: segmentedFiles },
      },
      'filename',
      { limit: this.batchSize }
    )) as (FileType & { filename: string; _id: ObjectIdSchema })[];

    return files.map(file => ({ _id: file._id, filename: file.filename }));
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
      await SegmentationModel.save({
        ...segmentation,
        filename,
        autoexpire: null,
        status: 'failed',
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
