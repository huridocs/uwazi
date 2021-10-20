import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath, fileFromReadStream, createDirIfNotExists } from 'api/files';
import { Readable } from 'stream';
import filesModel from 'api/files/filesModel';
import fs from 'fs';
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
  SERVICE_NAME = 'segmentation';

  public segmentationTaskManager: TaskManager;

  templatesWithInformationExtraction: string[] | undefined;

  features: Settings | undefined;

  batchSize = 10;

  constructor() {
    this.segmentationTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  segmentOnePdf = async (file: FileType, serviceUrl: string, tenant: string) => {
    if (!file.filename) {
      return;
    }

    const fileBuffer = fs.readFileSync(uploadsPath(file.filename));
    try {
      await request.uploadFile(serviceUrl, file.filename, fileBuffer);
    } catch {
      handleError(`Error uploading file to segmentation service, tenant: ${tenant}`);
      return;
    }

    const task = {
      task: this.SERVICE_NAME,
      tenant,
      params: {
        filename: file.filename,
      },
    };

    await this.segmentationTaskManager.startTask(task);
    await this.storeProcess(file._id!, file.filename);
  };

  storeProcess = async (fileID: ObjectIdSchema, filename: string) =>
    SegmentationModel.save({ fileID, filename });

  segmentPdfs = async () => {
    const pendingTasks = await this.segmentationTaskManager!.countPendingTasks();
    if (pendingTasks > 0) {
      return;
    }

    await Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          const settingsValues = await settings.get();
          const segmentationServiceConfig = settingsValues?.features?.segmentation;

          if (!segmentationServiceConfig) {
            return;
          }

          const filesToSegment = await filesModel.db.aggregate([
            {
              $match: {
                type: 'document',
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

          for (let i = 0; i < filesToSegment.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await this.segmentOnePdf(filesToSegment[i], segmentationServiceConfig.url, tenant);
          }
        }, tenant);
      })
    );
  };

  processResults = async (message: ResultsMessage) => {
    try {
      const response = await request.get(message.data_url);
      const fileStream = ((await fetch(message.file_url!)).body as unknown) as Readable;

      if (!fileStream) {
        throw new Error(`Error requesting segmentation results, tenant: ${message.tenant}`);
      }

      await tenants.run(async () => {
        await createDirIfNotExists(path.join(uploadsPath(), this.SERVICE_NAME));
        const filePath = path.join(uploadsPath(), this.SERVICE_NAME);
        const fileName = `${path.basename(
          message.params!.filename,
          path.extname(message.params!.filename)
        )}.xml`;

        await fileFromReadStream(fileName, fileStream, filePath);

        const [segmentation] = await SegmentationModel.get({ filename: message.params!.filename });
        // eslint-disable-next-line camelcase
        const { paragraphs, page_height, page_width } = JSON.parse(response.json);
        await SegmentationModel.save({
          ...segmentation,
          segmentation: { page_height, page_width, paragraphs },
          autoexpire: null,
          status: 'completed',
        });
      }, message.tenant);
    } catch (error) {
      handleError(error);
    }
  };
}

export { PDFSegmentation };
