import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { files, uploadsPath } from 'api/files';
import filesModel from 'api/files/filesModel';
import fs from 'fs';
import { FileType } from 'shared/types/fileType';
import { config } from 'api/config';
import { Settings } from 'shared/types/settingsType';
import settings from 'api/settings/settings';
import { model as entities } from 'api/entities';
import { tenants } from 'api/tenants/tenantContext';
import { SegmentationModel } from './segmentationModel';
import { ObjectIdSchema } from 'shared/types/commonTypes';

class SegmentPdfs {
  SERVICE_NAME = 'segmentation';

  public segmentationTaskManager: TaskManager | undefined;

  templatesWithInformationExtraction: string[] | undefined;

  features: Settings | undefined;

  async start() {
    const settingsValues = await settings.get();

    const metadataExtractionFeatureToggle = settingsValues?.features?.metadataExtraction;
    this.templatesWithInformationExtraction = metadataExtractionFeatureToggle?.map(x =>
      x.template.toString()
    );
    const segmentationValues = settingsValues?.features?.segmentation;
    this.segmentationTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      dataUrl: segmentationValues.dataUrl,
      filesUrl: segmentationValues.filesUrl,
      resultsUrl: segmentationValues.resultsUrl,
      redisUrl: `redis://${config.redis.host}:${config.redis.host}`,
    });
  }

  segmentOnePdf = async (nextFile: FileType) => {
    if (!this.segmentationTaskManager) {
      return;
    }

    if (!nextFile || !nextFile.filename) {
      return;
    }

    const file = fs.readFileSync(uploadsPath(nextFile.filename));
    await this.segmentationTaskManager.sendFile(file, nextFile.filename);
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

  segmentPdfs = async () =>
    Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          if (!this.segmentationTaskManager) {
            await this.start();
          }

          const settingsValues = await settings.get();
          const metadataExtractionFeatureToggle = settingsValues?.features?.metadataExtraction;
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
              $limit: 10,
            },
          ]);

          for (let i = 0; i < filesToSegment.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await this.segmentOnePdf(filesToSegment[i]);
          }
        }, tenant);
      })
    );
}

export { SegmentPdfs };
