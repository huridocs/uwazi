import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { uploadsPath } from 'api/files';
import filesModel from 'api/files/filesModel';
import fs from 'fs';
import { FileType } from 'shared/types/fileType';
import { Settings } from 'shared/types/settingsType';
import settings from 'api/settings/settings';
import { tenants } from 'api/tenants/tenantContext';
import { SegmentationModel } from './segmentationModel';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import request from 'shared/JSONRequest';

class PDFSegmentation {
  SERVICE_NAME = 'segmentation';

  public segmentationTaskManager: TaskManager | undefined;

  templatesWithInformationExtraction: string[] | undefined;

  features: Settings | undefined;

  batchSize = 1;

  async start() {
    this.segmentationTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
    });
  }

  segmentOnePdf = async (file: FileType, serviceUrl: string, tenant: string) => {
    if (!this.segmentationTaskManager) {
      return;
    }

    if (!file || !file.filename) {
      return;
    }
    console.log('segmentOnePdf', file.filename);
    const fileBuffer = fs.readFileSync(uploadsPath(file.filename));
    await request.uploadFile(serviceUrl, file.filename, fileBuffer);

    const task = {
      task: file.filename,
      tenant,
    };
    console.log('segmentOnePdf task');
    await this.segmentationTaskManager.startTask(task);
    console.log('store process');
    const segmentationCreated = await this.storeProcess(file._id!, file.filename);
    console.log(segmentationCreated);
  };

  storeProcess = async (fileID: ObjectIdSchema, fileName: string) =>
    SegmentationModel.save({ fileID, fileName });

  processResults = async (message: ResultsMessage) => {
    const response = await request.get(message.data_url);
    await tenants.run(async () => {
      const [segmentation] = await SegmentationModel.get({ fileName: message.task });
      console.log('processing results', message.task);
      await SegmentationModel.save({
        ...segmentation,
        segmentation: response.json,
        autoexpire: null,
        status: 'completed',
      });
    }, message.tenant);
  };

  segmentPdfs = async () =>
    Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          if (!this.segmentationTaskManager) {
            await this.start();
          }

          const pendingTasks = await this.segmentationTaskManager!.countPendingTasks();
          if (pendingTasks > 0) {
            console.log(`${pendingTasks} tasks are pending`);
            return;
          }

          const settingsValues = await settings.get();
          const metadataExtractionFeatureToggle = settingsValues?.features?.metadataExtraction;
          const segmentationServiceConfig = settingsValues?.features?.segmentation;

          if (!metadataExtractionFeatureToggle || !segmentationServiceConfig) {
            console.log('no configuration');
            return;
          }

          const templatesWithInformationExtraction = metadataExtractionFeatureToggle?.map(
            x => x.template
          );

          const filesToSegment = await filesModel.db.aggregate([
            {
              $match: {
                type: 'document',
              },
            },
            {
              $lookup: {
                from: 'segmentation',
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
              $lookup: {
                from: 'entities',
                localField: 'entity',
                foreignField: 'sharedId',
                as: 'entity',
              },
            },
            {
              $match: {
                'entity.template': { $in: templatesWithInformationExtraction },
              },
            },
            {
              $limit: this.batchSize,
            },
          ]);

          console.log('filesToSegment', filesToSegment.length);

          for (let i = 0; i < filesToSegment.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await this.segmentOnePdf(filesToSegment[i], segmentationServiceConfig.url, tenant);
          }
        }, tenant);
      })
    );
}

export { PDFSegmentation };
