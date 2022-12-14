import Ajv, { JTDDataType, ValidationError } from 'ajv/dist/jtd';
import { files, generateFileName, storage } from 'api/files';
import { processDocument } from 'api/files/processDocument';
import { tenants } from 'api/tenants';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import * as os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { TaskManager } from '../tasksmanager/TaskManager';
import { convertToPDFService } from './convertToPdfService';

const ajv = new Ajv();

const resultSchema = {
  properties: {
    file_url: { type: 'string' },
    params: {
      properties: {
        namespace: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  },
  optionalProperties: {},
} as const;

type ConvertToPdfResult = JTDDataType<typeof resultSchema>;
const validateResult = ajv.compile<ConvertToPdfResult>(resultSchema);

export class ConvertToPdfWorker {
  public readonly SERVICE_NAME = 'convert-to-pdf';

  taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: async result => {
        if (!validateResult(result)) {
          throw new ValidationError(validateResult.errors || [{ message: 'validation failed' }]);
        }
        await tenants.run(async () => {
          const [attachment] = await files.get({ filename: result.params.filename });
          if (!attachment.entity) {
            throw new Error('attachment does not have an entity');
          }
          await files.save({ ...attachment, status: 'ready' });

          const filename = `${generateFileName({})}.pdf`;
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
