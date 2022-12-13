import { files, storage } from 'api/files';
import { processDocument } from 'api/files/processDocument';
import { tenants } from 'api/tenants';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import * as os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import url from 'url';
import { TaskManager } from '../tasksmanager/TaskManager';
import { convertToPDFService } from './convertToPdfService';

export class ConvertToPdfWorker {
  public readonly SERVICE_NAME = 'convert-to-pdf';

  taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: async result => {
        if (!result?.params?.namespace) {
          throw new Error('result missing required properties');
        }

        await tenants.run(async () => {
          if (!result?.params?.filename || !result?.file_url) {
            throw new Error('result missing required properties');
          }
          const [attachment] = await files.get({ filename: result.params.filename });
          if (!attachment.entity) {
            throw new Error('attachment does not have an entity');
          }
          await files.save({ ...attachment, status: 'ready' });

          const urlPathName = url.parse(result.file_url).pathname;
          if (!urlPathName) {
            throw new Error('file url is wrong');
          }
          const filename = path.basename(urlPathName);
          const file: Readable = await convertToPDFService.download(new URL(result.file_url));

          await pipeline(file, createWriteStream(path.join(os.tmpdir(), filename)));
          await storage.storeFile(filename, file, 'document');

          await processDocument(attachment.entity, {
            filename,
            destination: os.tmpdir(),
          });
        }, result.params.namespace);
      },
    });
  }

  start() {
    this.taskManager.subscribeToResults();
  }

  async stop() {
    await this.taskManager.stop();
  }
}
