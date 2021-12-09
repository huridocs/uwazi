/* eslint-disable class-methods-use-this */
import { Readable } from 'stream';
import urljoin from 'url-join';

import entities from 'api/entities';
import { files, uploadsPath, readFile } from 'api/files';
import { generateFileName, fileFromReadStream } from 'api/files/filesystem';
import { processDocument } from 'api/files/processDocument';
import settings from 'api/settings/settings';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants/tenantContext';
import { handleError } from 'api/utils';
import request from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { OcrModel, OcrStatus } from './ocrModel';

class OcrManager {
  public readonly SERVICE_NAME = 'ocr';

  private ocrTaskManager: TaskManager;

  constructor() {
    this.ocrTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  async addToQueue(file: FileType) {
    const fileContent = await readFile(uploadsPath(file.filename));

    const settingsValues = await settings.get();
    const ocrServiceConfig = settingsValues?.features?.ocr;

    if (!ocrServiceConfig) {
      throw Error('Ocr settings are missing from the database (settings.features.ocr).');
    }
    const tenant = tenants.current();
    await request.uploadFile(
      urljoin(ocrServiceConfig!.url, 'upload', tenant.name),
      file.filename,
      fileContent
    );

    await this.ocrTaskManager.startTask({
      task: this.SERVICE_NAME,
      tenant: tenant.name,
      params: {
        filename: file.filename,
      },
    });

    await OcrModel.save({
      sourceFile: file._id,
      language: file.language,
      status: OcrStatus.PROCESSING,
    });
  }

  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({ sourceFile: file._id });
    return record ? record.status : OcrStatus.NONE;
  }

  private async processResults(message: ResultsMessage): Promise<void> {
    // eslint-disable-next-line max-statements
    await tenants.run(async () => {
      try {
        if (!message.success) {
          // update record with error
          return;
        }
        const fileResponse = await fetch(message.file_url!);
        const fileStream = fileResponse.body as unknown as Readable;
        if (!fileStream) {
          throw new Error(
            `Error requesting for ocr file: ${message.params!.filename}, tenant: ${message.tenant}`
          );
        }

        const originalFileName = message.params!.filename;
        const originalFile = (await files.get({ filename: originalFileName }))[0];
        const newFileName = generateFileName(originalFile);
        const filePath = await fileFromReadStream(newFileName, fileStream);
        // const parentEntities = await entities.get({ sharedId: originalFile.entity });
        // const savedFile = await processDocument(originalFile.entity, {
        //   originalname: `ocr_${originalFile.originalname}`,
        //   filename: newFileName,
        //   mimetype: fileResponse.headers.get('Content-Type'),
        //   size: fileResponse.headers.get('Content-Length'),
        //   language: originalFile.language,
        //   type: 'document',
        //   // uploaded?: boolean;
        // });

        //perform usual steps on new file

        //update record with success, (make it permanent?)

        return;
      } catch (error) {
        handleError(error);
      }
    }, message.tenant);
  }
}

const OcrManagerInstance = new OcrManager();

export default OcrManagerInstance;

export { OcrManager };
