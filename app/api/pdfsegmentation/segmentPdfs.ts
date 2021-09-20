import { TaskManager } from 'api/tasksmanager/taskManager';
import { files, uploadsPath } from 'api/files';
import fs from 'fs';
import { FileType } from 'shared/types/fileType';
import { config } from 'api/config';
import { Settings } from 'shared/types/settingsType';
import settings from 'api/settings/settings';
import entities from 'api/entities';

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

  segmentPdfs = async () => {
    if (!this.segmentationTaskManager) {
      await this.start();
    }

    console.log(this.templatesWithInformationExtraction);

    const nextEntitiesToProcess = await entities.get({
      template: { $in: this.templatesWithInformationExtraction },
    });

    const sharedIds = nextEntitiesToProcess.map(x => x.sharedId);
    const nextFilesToProcess = await files.get({
      entity: { $in: sharedIds },
    });

    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.segmentOnePdf(nextFilesToProcess[i]);
    }
  };
}

export { SegmentPdfs };
