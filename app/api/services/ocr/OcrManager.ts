/* eslint-disable class-methods-use-this */
import { Readable } from 'stream';
import urljoin from 'url-join';

import { files, uploadsPath, readFile } from 'api/files';
import { generateFileName, fileFromReadStream } from 'api/files/filesystem';
import { processDocument } from 'api/files/processDocument';
import settings from 'api/settings/settings';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants/tenantContext';
import request from 'shared/JSONRequest';
import { FileType } from 'shared/types/fileType';
import { OcrModel, OcrRecord, OcrStatus } from './ocrModel';

class OcrManager {
  public readonly SERVICE_NAME = 'ocr';

  private LANGUAGES_MAP: { [key: string]: string } = {
    arb: 'ar',
    deu: 'de',
    eng: 'en',
    fra: 'fr',
    spa: 'es',
  };

  private ocrTaskManager: TaskManager;

  constructor() {
    this.ocrTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults.bind(this),
    });
  }

  private async validateNotInQueue(file: FileType) {
    const [record] = await OcrModel.get({ sourceFile: file._id });

    if (record) {
      throw Error(`An OCR task for ${file.filename} is already in the queue`);
    }
  }

  async addToQueue(file: FileType) {
    await this.validateNotInQueue(file);

    const settingsValues = await this.getSettings();

    await this.validateLanguage(file.language || 'other', settingsValues);

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
        language: this.LANGUAGES_MAP[file.language || 'other'],
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

  private async fetchSupportedLanguages(ocrSettings: any) {
    const response = await fetch(urljoin(ocrSettings.url, 'info'));
    const body = await response.json();
    return body.supported_languages as string[];
  }

  private async validateLanguage(language: string, ocrSettings: any) {
    const supportedLanguages = await this.fetchSupportedLanguages(ocrSettings);
    if (!supportedLanguages.includes(this.LANGUAGES_MAP[language])) {
      throw Error('Language not supported');
    }
  }

  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({
      $or: [{ sourceFile: file._id }, { resultFile: file._id }],
    });

    const status = record ? record.status : OcrStatus.NONE;

    if (status !== OcrStatus.READY) {
      const ocrSettings = await this.getSettings();
      const supportedLanguages = await this.fetchSupportedLanguages(ocrSettings);
      if (!supportedLanguages.includes(this.LANGUAGES_MAP[file.language || 'other'])) {
        return OcrStatus.UNSUPPORTED_LANGUAGE;
      }
    }

    return status;
  }

  private async saveResultFile(message: ResultsMessage, originalFile: FileType) {
    const fileResponse = await fetch(message.file_url!);
    const fileStream = fileResponse.body as unknown as Readable;
    if (!fileStream) {
      throw new Error(
        `Error requesting for OCR file: ${message.params!.filename}, tenant: ${message.tenant}`
      );
    }

    const newFileName = generateFileName(originalFile);
    await fileFromReadStream(newFileName, fileStream);

    return processDocument(
      originalFile.entity!,
      {
        originalname: `ocr_${originalFile.originalname}`,
        filename: newFileName,
        mimetype: fileResponse.headers.get('Content-Type')!,
        size: parseInt(fileResponse.headers.get('Content-Length')!, 10),
        language: originalFile.language,
        type: 'document',
        // @ts-ignore
        destination: uploadsPath(),
      },
      false
    );
  }

  private async processFiles(record: OcrRecord, message: ResultsMessage, originalFile: FileType) {
    const resultFile = await this.saveResultFile(message, originalFile);
    await files.save({ ...originalFile, type: 'attachment' });
    await OcrModel.save({
      ...record,
      status: OcrStatus.READY,
      resultFile: resultFile._id,
      autoexpire: null,
    });
  }

  private async processResults(message: ResultsMessage): Promise<void> {
    await tenants.run(async () => {
      const [originalFile] = await files.get({ filename: message.params!.filename });
      const [record] = await OcrModel.get({ sourceFile: originalFile._id });

      if (!record) {
        return;
      }

      if (!message.success) {
        await OcrModel.save({ ...record, status: OcrStatus.ERROR });
        return;
      }

      await this.processFiles(record, message, originalFile);
    }, message.tenant);
  }
}

const OcrManagerInstance = new OcrManager();

export default OcrManagerInstance;

export { OcrManager };
