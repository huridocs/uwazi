import { TaskManager } from 'api/tasksmanager/taskManager';
import { files, uploadsPath } from 'api/files';
import fs from 'fs';
import { FileType } from 'shared/types/fileType';
import { config } from 'api/config';
import { Settings } from 'shared/types/settingsType';
import settings from 'api/settings/settings';
import { model as entities } from 'api/entities';
import { tenants } from 'api/tenants/tenantContext';

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
          const templatesWithInformationExtraction = metadataExtractionFeatureToggle?.map(x =>
            x.template.toString()
          );

          const nextEntitiesToProcess = await entities.getUnrestricted({
            template: { $in: templatesWithInformationExtraction },
          });

          const sharedIds = nextEntitiesToProcess.map((x: { sharedId: string }) => x.sharedId);
          const nextFilesToProcess = await files.get({
            entity: { $in: sharedIds },
          });

          for (let i = 0; i < 10; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await this.segmentOnePdf(nextFilesToProcess[i]);
          }
        }, tenant);
      })
    );
}

export { SegmentPdfs };
