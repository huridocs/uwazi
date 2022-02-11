import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath, fileFromReadStream, createDirIfNotExists, readFile } from 'api/files';
import { Readable } from 'stream';
import urljoin from 'url-join';
import { filesModel } from 'api/files/filesModel';
import path from 'path';
import { FileType } from 'shared/types/fileType';
import { Settings } from 'shared/types/settingsType';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import request from 'shared/JSONRequest';
import { handleError } from 'api/utils';
import { SegmentationModel } from './segmentationModel';

class PDFSegmentation {
  static SERVICE_NAME = 'segmentation';

  public segmentationTaskManager: TaskManager;

  templatesWithInformationExtraction: string[] | undefined;

  features: Settings | undefined;

  batchSize = 10;

  constructor() {
    this.segmentationTaskManager = new TaskManager({
      serviceName: PDFSegmentation.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  segmentOnePdf = async (
    file: FileType & { filename: string; _id: ObjectIdSchema },
    serviceUrl: string,
    tenant: string
  ) => {
    try {
      const fileContent = await readFile(uploadsPath(file.filename));
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

  getFilesToSegment = async (): Promise<FileType & { filename: string; _id: ObjectIdSchema }[]> =>
    filesModel.db.aggregate([
      {
        $match: {
          type: 'document',
          filename: { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'segmentations',
          localField: '_id',
          foreignField: 'fileID',
          as: 'segmentation',
        },
      },
      {
        $match: {
          segmentation: {
            $size: 0,
          },
        },
      },
      {
        $limit: this.batchSize,
      },
    ]);

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
    const folderPath = uploadsPath(PDFSegmentation.SERVICE_NAME);
    await createDirIfNotExists(folderPath);
    const xmlname = PDFSegmentation.getXMLNAme(filename);

    await fileFromReadStream(xmlname, fileStream, folderPath);
  };

  saveSegmentation = async (filename: string, data: any) => {
    const [segmentation] = await SegmentationModel.get({ filename });
    // eslint-disable-next-line camelcase
    const { paragraphs, page_height, page_width } = data;
    await SegmentationModel.save({
      ...segmentation,
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
