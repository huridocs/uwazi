/* eslint-disable max-lines */
/* eslint-disable class-methods-use-this */
import { Readable } from 'stream';
import urljoin from 'url-join';
import { files, uploadsPath, readFile } from 'api/files';
import { generateFileName, fileFromReadStream } from 'api/files/filesystem';
import { processDocument } from 'api/files/processDocument';
import { WithId } from 'api/odm';
import settings from 'api/settings/settings';
import { TaskManager, ResultsMessage } from 'api/services/tasksmanager/TaskManager';
import { emitToTenant } from 'api/socketio/setupSockets';
import { tenants } from 'api/tenants/tenantContext';
import createError from 'api/utils/Error';
import request from 'shared/JSONRequest';
import { ensure } from 'shared/tsUtils';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import relationships from 'api/relationships';
import { OcrModel, OcrRecord, OcrStatus } from './ocrModel';
import { EnforcedWithId } from '../../odm/model';
import { handleError } from 'api/utils/handleError';

class OcrManager {
  public readonly SERVICE_NAME = 'ocr';

  private LANGUAGES_MAP: { [key: string]: string } = {
    arb: 'ar',
    deu: 'de',
    eng: 'en',
    fra: 'fr',
    spa: 'es',
  };

  private ocrTaskManager: TaskManager | null = null;

  start() {
    this.ocrTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults: this.processResults.bind(this),
    });
  }

  isReady() {
    return Boolean(this.ocrTaskManager);
  }

  async isEnabled() {
    const settingsObject = await settings.get();
    return Boolean(settingsObject.features?.ocr?.url) && Boolean(settingsObject.toggleOCRButton);
  }

  private async validateNotInQueue(file: FileType) {
    const [record] = await OcrModel.get({ sourceFile: file._id });

    if (record) {
      throw Error(`An OCR task for ${file.filename} is already in the queue`);
    }
  }

  private validateFileIsDocument(file: FileType) {
    if (file.type !== 'document') {
      throw createError('The file is not a document.', 400);
    }
  }

  private validateIsReady() {
    if (!this.isReady()) {
      throw createError('The OCR manager is not ready.', 500);
    }
  }

  async addToQueue(file: FileType) {
    this.validateIsReady();
    this.validateFileIsDocument(file);
    await this.validateNotInQueue(file);

    const settingsValues = await this.getSettings();

    if (!(await this.validateLanguage(file.language || 'other', settingsValues))) {
      throw Error('Language not supported');
    }

    const fileContent = await readFile(uploadsPath(file.filename));
    const tenant = tenants.current();

    await request.uploadFile(
      urljoin(settingsValues.url, 'upload', tenant.name),
      file.filename,
      fileContent
    );

    await this.ocrTaskManager!.startTask({
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
      lastUpdated: Date.now(),
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

  private async fetchSupportedLanguages(ocrSettings: { url: string }) {
    const response = await fetch(urljoin(ocrSettings.url, 'info'));
    const body = await response.json();
    return body.supported_languages as string[];
  }

  private async validateLanguage(language: string, ocrSettings?: { url: string }) {
    const _ocrSettings = ocrSettings || (await this.getSettings());
    const supportedLanguages = await this.fetchSupportedLanguages(_ocrSettings);
    return supportedLanguages.includes(this.LANGUAGES_MAP[language]);
  }

  // eslint-disable-next-line max-statements
  async getStatus(file: FileType) {
    const [record] = await OcrModel.get({
      $or: [{ sourceFile: file._id }, { resultFile: file._id }],
    });

    const status = record ? record.status : OcrStatus.NONE;

    if (status === OcrStatus.NONE) {
      this.validateFileIsDocument(file);
    }

    if (status !== OcrStatus.READY && !(await this.validateLanguage(file.language || 'other'))) {
      return { status: OcrStatus.UNSUPPORTED_LANGUAGE };
    }

    return { status, ...(record ? { lastUpdated: record.lastUpdated } : {}) };
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

  private async processFiles(
    record: OcrRecord,
    message: ResultsMessage,
    originalFile: EnforcedWithId<FileType>
  ) {
    const resultFile = await this.saveResultFile(message, originalFile);
    await files.save({ ...originalFile, type: 'attachment' });
    await OcrModel.save({
      ...record,
      status: OcrStatus.READY,
      resultFile: resultFile._id,
      autoexpire: null,
      lastUpdated: Date.now(),
    });
    await relationships.swapTextReferencesFile(
      originalFile._id.toHexString(),
      resultFile._id.toHexString()
    );
  }

  private async processResults(message: ResultsMessage): Promise<void> {
    await tenants.run(async () => {
      try {
        const [originalFile] = await files.get({ filename: message.params!.filename });
        const [record] = await OcrModel.get({ sourceFile: originalFile._id });

        if (!record) {
          return;
        }

        if (!message.success) {
          await OcrModel.save({
            ...record,
            status: OcrStatus.ERROR,
            autoexpire: null,
            lastUpdated: Date.now(),
          });
          emitToTenant(message.tenant, 'ocr:error', originalFile._id.toHexString());
          return;
        }

        await this.processFiles(record, message, originalFile);
        emitToTenant(message.tenant, 'ocr:ready', originalFile._id.toHexString());
      } catch (e) {
        handleError(e);
      }
    }, message.tenant);
  }

  async cleanupRecordsOfFiles(fileIds: (ObjectIdSchema | undefined)[]) {
    const idStrings = fileIds
      .filter(fid => fid !== undefined)
      .map(fid => ensure<WithId<ObjectIdSchema>>(fid).toString());
    const records = await OcrModel.get({
      $or: [{ sourceFile: { $in: idStrings } }, { resultFile: { $in: idStrings } }],
    });
    const idRecordMap = new Map();
    const recordsToNullSource: OcrRecord[] = [];
    const recordIdsToDelete: string[] = [];

    records.forEach(record => {
      if (record.sourceFile) {
        idRecordMap.set(record.sourceFile.toString(), record);
      }
      if (record.resultFile) {
        idRecordMap.set(record.resultFile.toString(), record);
      }
    });

    idStrings.forEach(fileId => {
      if (idRecordMap.has(fileId)) {
        const record = idRecordMap.get(fileId);
        if (record.sourceFile?.toString() === fileId) {
          recordsToNullSource.push({ ...record, sourceFile: null });
        } else if (record.resultFile?.toString() === fileId) {
          recordIdsToDelete.push(record._id.toString());
        }
      }
    });

    await OcrModel.saveMultiple(recordsToNullSource);
    await OcrModel.delete({ _id: { $in: recordIdsToDelete } });
  }
}

const OcrManagerInstance = new OcrManager();
export { OcrManagerInstance, OcrManager };
