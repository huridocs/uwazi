import { Service, TaskManager } from 'api/tasksmanager/taskManager';
import { RepeatWith } from 'api/tasksmanager/RepeatWith';
import { files, uploadsPath } from 'api/files';
import fs from 'fs';

export interface SegmentationParameters {
  filesUrl: string;
  dataUrl: string;
  resultsUrl: string;
  redisUrl: string;
}
export const SERVICE_NAME = 'pdfSegmentation';

export class PdfSegmentation {
  private service: Service;

  private repeatWith: RepeatWith;

  private taskManager: TaskManager;

  constructor(segmentationParameters: SegmentationParameters) {
    this.service = {
      serviceName: SERVICE_NAME,
      ...segmentationParameters,
    };

    this.repeatWith = new RepeatWith(SERVICE_NAME, this.segment.bind(this), 120000, 100);
    this.taskManager = new TaskManager(this.service);
  }

  async start() {
    await this.repeatWith.start();
  }

  async stop() {
    await this.repeatWith.stop();
  }

  async segment() {
    const nextFilesToProcess = await files.get({
      type: 'document',
    });

    if (nextFilesToProcess.length === 0 || !nextFilesToProcess[0].filename) {
      return;
    }

    const file = fs.readFileSync(uploadsPath(nextFilesToProcess[0].filename));
    await this.taskManager.sendFile(file, nextFilesToProcess[0].filename);
    const task = {
      task: nextFilesToProcess[0].filename,
      tenant: 'tenant1',
    };
    await this.taskManager.startTask(task);
  }
}
