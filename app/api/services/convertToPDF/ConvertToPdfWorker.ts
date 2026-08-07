import Ajv, { JTDDataType, ValidationError } from 'ajv/dist/jtd.js';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import * as os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { files, generateFileName, storage } from '#api/files/index.js';
import { processDocument } from '#api/files/processDocument.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { emitToSession } from '#api/socketio/setupSockets.js';
import { tenants } from '#api/tenants/index.js';
import { FileType } from '#shared/types/fileType.js';

import { TaskManager } from '../tasksmanager/TaskManager.js';
import { convertToPDFService } from './convertToPdfService.js';

const ajv = new Ajv();

const resultSchema = {
  properties: {
    file_url: { type: 'string' },
    params: {
      properties: {
        namespace: { type: 'string' },
        filename: { type: 'string' },
      },
      optionalProperties: {
        sessionId: { type: 'string' },
      },
    },
  },
  additionalProperties: true,
} as const;

type ConvertToPdfResult = JTDDataType<typeof resultSchema>;
const validateResult = ajv.compile<ConvertToPdfResult>(resultSchema);

const chageFileExtesion = (fileName: string, extension: string) =>
  `${path.basename(fileName, path.extname(fileName))}.${extension}`;

const resolveSessionId = (result: ConvertToPdfResult, attachment: FileType) =>
  result.params.sessionId ||
  (typeof (attachment as { socketSessionId?: string }).socketSessionId === 'string'
    ? (attachment as { socketSessionId?: string }).socketSessionId
    : undefined);

const storeConvertedPdfLocally = async (filename: string, fileUrl: string) => {
  await storage.storeFile(
    filename,
    await convertToPDFService.download(new URL(fileUrl)),
    'document'
  );
  await pipeline(
    await storage.readableFile(filename, 'document'),
    createWriteStream(path.join(os.tmpdir(), filename))
  );
};

const markAttachmentReady = async (filename: string) => {
  const [attachment] = await files.get({ filename });
  if (!attachment.entity) {
    throw new Error('attachment does not have an entity');
  }
  await files.save({ ...attachment, status: 'ready' });
  return attachment as FileType & { entity: string };
};

const processConvertToPdfResult = async (result: ConvertToPdfResult) => {
  permissionsContext.setCommandContext();
  const attachment = await markAttachmentReady(result.params.filename);
  const filename = `${generateFileName({})}.pdf`;
  await storeConvertedPdfLocally(filename, result.file_url);
  await processDocument(attachment.entity, {
    filename,
    destination: os.tmpdir(),
    originalname: chageFileExtesion(attachment.originalname || generateFileName({}), 'pdf'),
    mimetype: 'application/pdf',
  });

  const sessionId = resolveSessionId(result, attachment);
  if (sessionId) {
    emitToSession(sessionId, 'documentProcessed', attachment.entity);
  }
};

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
        await tenants.run(async () => processConvertToPdfResult(result), result.params.namespace);
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
