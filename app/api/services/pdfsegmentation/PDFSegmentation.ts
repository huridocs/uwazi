import { TaskManager } from 'api/services/tasksmanager/TaskManager';
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

class SegmentPdfs {
  SERVICE_NAME = 'segmentation';

  public segmentationTaskManager: TaskManager | undefined;

  templatesWithInformationExtraction: string[] | undefined;

  features: Settings | undefined;

  batchSize = 10;

  async start() {
    this.segmentationTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
    });
  }

  segmentOnePdf = async (nextFile: FileType, url: string) => {
    if (!this.segmentationTaskManager) {
      return;
    }

    if (!nextFile || !nextFile.filename) {
      return;
    }

    const file = fs.readFileSync(uploadsPath(nextFile.filename));
    await request.uploadFile(url, nextFile.filename, file);

    const task = {
      task: nextFile.filename,
      tenant: 'tenant1',
    };
    await this.segmentationTaskManager.startTask(task);
    await this.storeProcess(nextFile._id!, nextFile.filename);
  };

  storeProcess = async (fileID: ObjectIdSchema, fileName: string) => {
    await SegmentationModel.save({ fileID, fileName });
  };

  storeResult = async task => {
    // const fileName = task.task;
    // await SegmentationModel.save({ fileName, segmentation: results, autoexpire: false });
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
            return;
          }

          const settingsValues = await settings.get();
          const metadataExtractionFeatureToggle = settingsValues?.features?.metadataExtraction;
          const segmentationServiceConfig = settingsValues?.features?.segmentation;

          if (!metadataExtractionFeatureToggle || !segmentationServiceConfig) {
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

          for (let i = 0; i < filesToSegment.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await this.segmentOnePdf(filesToSegment[i], segmentationServiceConfig.url);
          }
        }, tenant);
      })
    );
}

export { SegmentPdfs };
