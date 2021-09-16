import { Service, TaskManager } from 'api/tasksmanager/taskManager';
import { RepeatWith } from 'api/tasksmanager/RepeatWith';
import { files, uploadsPath } from 'api/files';
import fs from 'fs';
import { FileType } from 'shared/types/fileType';

export interface SegmentationParameters {
  filesUrl: string;
  dataUrl: string;
  resultsUrl: string;
  redisUrl: string;
}
export const SERVICE_NAME = 'pdfSegmentation';

export class PdfSegmentation {
  private readonly service: Service;

  private repeatWith: RepeatWith;

  private taskManager: TaskManager;

  constructor(segmentationParameters: SegmentationParameters) {
    this.service = {
      serviceName: SERVICE_NAME,
      ...segmentationParameters,
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await nextFilesToProcess.forEach(async nextFile => {
      await this.segmentOne(nextFile);
    });
  }

  private async segmentOne(nextFile: FileType) {
    if (!nextFile || !nextFile.filename) {
      return;
    }
    const file = fs.readFileSync(uploadsPath(nextFile.filename));
    await this.taskManager.sendFile(file, nextFile.filename);
    const task = {
      task: nextFile.filename,
      tenant: 'tenant1',
    };
    await this.taskManager.startTask(task);
  }
}
