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

const availableLanguages: { [key: string]: string } = {
  arb: 'ar',
  deu: 'de',
  eng: 'en',
  fra: 'fr',
  spa: 'es',
};

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
    //TODO: validate OCR status.

    const settingsValues = await this.getSettings();

    if (!(await this.validateLanguage(file.language || '', settingsValues))) {
      throw Error('Unsupported language');
    }

    const fileContent = await readFile(uploadsPath(file.filename));
    const tenant = tenants.current();

    await request.uploadFile(
      urljoin(settingsValues.url, 'upload', tenant.name),
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

  private async getSettings() {
    const settingsValues = await settings.get();
    const ocrServiceConfig = settingsValues?.features?.ocr;

    if (!ocrServiceConfig) {
      throw Error('Ocr settings are missing from the database (settings.features.ocr).');
    }

    return ocrServiceConfig;
  }

  private async validateLanguage(language: string, settings: any) {
    const response = await fetch(urljoin(settings.url, 'info'));
    const body = await response.json();
    return body.supported_languages.includes(availableLanguages[language]);
  }

  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({
      $or: [{ sourceFile: file._id }, { resultFile: file._id }],
    });

    const status = record ? record.status : OcrStatus.NONE;

    if (status !== OcrStatus.READY) {
      const settings = await this.getSettings();
      if (!(await this.validateLanguage(file.language || '', settings))) {
        return OcrStatus.UNSUPPORTED_LANGUAGE;
      }
    }
    
    return status;
  }

  private async processResults(message: ResultsMessage): Promise<void> {
    await tenants.run(async () => {
      //try {
        const [originalFile] = await files.get({ filename: message.params!.filename });
        const [record] = await OcrModel.get({ sourceFile: originalFile._id });

        if (!record) {
          return;
        }

        if (!message.success) {
          OcrModel.save({ ...record, status: OcrStatus.ERROR });
          return;
        }

        const fileResponse = await fetch(message.file_url!);
        const fileStream = fileResponse.body as unknown as Readable;
        if (!fileStream) {
          throw new Error(
            `Error requesting for OCR file: ${message.params!.filename}, tenant: ${message.tenant}`
          );
        }

        const newFileName = generateFileName(originalFile);
        await fileFromReadStream(newFileName, fileStream);

        const savedFile = await processDocument(originalFile.entity!, {
          originalname: `ocr_${originalFile.originalname}`,
          filename: newFileName,
          mimetype: fileResponse.headers.get('Content-Type')!,
          size: parseInt(fileResponse.headers.get('Content-Length')!, 10),
          language: originalFile.language,
          type: 'document',
          // @ts-ignore
          destination: uploadsPath(),
        }, false);

        await files.save({ ...originalFile, type: 'attachment' });
        await OcrModel.save({
          ...record,
          status: OcrStatus.READY,
          resultFile: savedFile._id,
          autoexpire: null,
        });
      // } catch (error) {
      //   handleError(error);
      // }
    }, message.tenant);
  }
}

const OcrManagerInstance = new OcrManager();

export default OcrManagerInstance;

export { OcrManager };
