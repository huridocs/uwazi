import Ajv, { JTDDataType, ValidationError } from 'ajv/dist/jtd';
import { files, generateFileName, storage } from 'api/files';
import { processDocument } from 'api/files/processDocument';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { emitToTenant } from 'api/socketio/setupSockets';
import { tenants } from 'api/tenants';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import * as os from 'os';
import path from 'path';
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
  additionalProperties: true,
} as const;

type ConvertToPdfResult = JTDDataType<typeof resultSchema>;
const validateResult = ajv.compile<ConvertToPdfResult>(resultSchema);

const chageFileExtesion = (fileName: string, extension: string) =>
  `${path.basename(fileName, path.extname(fileName))}.${extension}`;

export class ConvertToPdfWorker {
  public readonly SERVICE_NAME = 'convert-to-pdf';

  taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: async result => {
        if (result.success === false) {
          throw new Error(result.error_message);
        }
        if (!validateResult(result)) {
          throw new ValidationError(validateResult.errors || [{ message: 'validation failed' }]);
        }
        await tenants.run(async () => {
          permissionsContext.setCommandContext();
          const [attachment] = await files.get({ filename: result.params.filename });
          if (!attachment.entity) {
            throw new Error('attachment does not have an entity');
          }
          await files.save({ ...attachment, status: 'ready' });

          const filename = `${generateFileName({})}.pdf`;

          await storage.storeFile(
            filename,
            await convertToPDFService.download(new URL(result.file_url)),
            'document'
          );
          await pipeline(
            await storage.readableFile(filename, 'document'),
            createWriteStream(path.join(os.tmpdir(), filename))
          );

          await processDocument(attachment.entity, {
            filename,
            destination: os.tmpdir(),
            originalname: chageFileExtesion(attachment.originalname || generateFileName({}), 'pdf'),
            mimetype: 'application/pdf',
          });

          emitToTenant(result.params.namespace, 'documentProcessed', attachment.entity);
        }, result.params.namespace);
      },
    });
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }
}
