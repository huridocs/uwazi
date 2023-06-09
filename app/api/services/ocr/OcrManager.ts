import { files, storage } from 'api/files';
import { generateFileName, temporalFilesPath } from 'api/files/filesystem';
import { processDocument } from 'api/files/processDocument';
import relationships from 'api/relationships';
import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import settings from 'api/settings/settings';
import { emitToTenant } from 'api/socketio/setupSockets';
import { tenants } from 'api/tenants/tenantContext';
import createError from 'api/utils/Error';
import { handleError } from 'api/utils/handleError';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
import request from 'shared/JSONRequest';
import { language as getLanguage } from 'shared/languagesList';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import urljoin from 'url-join';
import { EnforcedWithId } from '../../odm/model';
import { OcrRecord, OcrStatus } from './ocrModel';
import {
  createForFile,
  getForSourceFile,
  getForSourceOrTargetFile,
  markError,
  markReady,
} from './ocrRecords';

interface OcrSettings {
  url: string;
}

const isEnabled = async () => {
  const settingsObject = await settings.get();
  return Boolean(settingsObject.features?.ocr?.url) && Boolean(settingsObject.ocrServiceEnabled);
};

const validateNotInQueue = async (file: EnforcedWithId<FileType>) => {
  const [record] = await getForSourceFile(file);

  if (record) {
    throw Error(`An OCR task for ${file.filename} is already in the queue`);
  }
};

const validateFileIsDocument = (file: FileType) => {
  if (file.type !== 'document') {
    throw createError('The file is not a document.', 400);
  }
};

const getSettings = async (): Promise<OcrSettings> => {
  const settingsValues = await settings.get();
  const ocrServiceConfig = settingsValues?.features?.ocr;

  if (!ocrServiceConfig) {
    throw Error('Ocr settings are missing from the database (settings.features.ocr).');
  }

  return ocrServiceConfig;
};

const fetchSupportedLanguages = async (ocrSettings: { url: string }) => {
  const response = await fetch(urljoin(ocrSettings.url, 'info'));
  const body = await response.json();
  return body.supported_languages as string[];
};

const saveResultFile = async (message: ResultsMessage, originalFile: FileType) => {
  const fileResponse = await fetch(message.file_url!);
  const fileStream = fileResponse.body as unknown as Readable;
  if (!fileStream) {
    throw new Error(
      `Error requesting for OCR file: ${message.params!.filename}, tenant: ${message.tenant}`
    );
  }

  const newFileName = generateFileName(originalFile);

  await pipeline(fileStream, createWriteStream(temporalFilesPath(newFileName)));

  await storage.storeFile(
    newFileName,
    createReadStream(temporalFilesPath(newFileName)),
    'document'
  );
  return processDocument(
    originalFile.entity!,
    {
      originalname: `ocr_${originalFile.originalname}`,
      filename: newFileName,
      mimetype: fileResponse.headers.get('Content-Type')!,
      size: parseInt(fileResponse.headers.get('Content-Length')!, 10),
      language: originalFile.language,
      type: 'document',
      destination: temporalFilesPath(),
    },
    false
  );
};

const processFiles = async (
  record: OcrRecord,
  message: ResultsMessage,
  originalFile: EnforcedWithId<FileType>
) => {
  const resultFile = await saveResultFile(message, originalFile);
  await files.save({ ...originalFile, type: 'attachment' });
  await markReady(record, resultFile as EnforcedWithId<FileType>);
  await relationships.swapTextReferencesFile(
    originalFile._id.toHexString(),
    resultFile._id.toHexString()
  );
};

const handleOcrError = async (
  record: OcrRecord,
  originalFile: EnforcedWithId<FileType>,
  message: ResultsMessage
) => {
  await markError(record);
  emitToTenant(message.tenant, 'ocr:error', originalFile._id.toHexString());
};

const processResults = async (message: ResultsMessage): Promise<void> => {
  await tenants.run(async () => {
    try {
      const [originalFile] = await files.get({ filename: message.params!.filename });
      const [record] = await getForSourceFile(originalFile);

      if (!record) return;

      if (!message.success) {
        await handleOcrError(record, originalFile, message);
        return;
      }

      await processFiles(record, message, originalFile);
      emitToTenant(message.tenant, 'ocr:ready', originalFile._id.toHexString());
    } catch (e) {
      handleError(e);
    }
  }, message.tenant);
};

const validateLanguage = async (language: string, ocrSettings?: { url: string }) => {
  const _ocrSettings = ocrSettings || (await getSettings());
  const supportedLanguages = await fetchSupportedLanguages(_ocrSettings);
  return supportedLanguages.includes(getLanguage(language, 'ISO639_1')!);
};

const getStatus = async (file: EnforcedWithId<FileType>) => {
  const [record] = await getForSourceOrTargetFile(file);

  const status = record ? record.status : OcrStatus.NONE;

  if (status === OcrStatus.NONE) {
    validateFileIsDocument(file);
  }

  if (status !== OcrStatus.READY && !(await validateLanguage(file.language || 'other'))) {
    return { status: OcrStatus.UNSUPPORTED_LANGUAGE };
  }

  return { status, ...(record ? { lastUpdated: record.lastUpdated } : {}) };
};

const validateTaskIsAdmissible = async (
  file: EnforcedWithId<FileType>,
  settingsValues: OcrSettings
) => {
  validateFileIsDocument(file);
  await validateNotInQueue(file);

  if (!(await validateLanguage(file.language || 'other', settingsValues))) {
    throw Error('Language not supported');
  }
};

class OcrManager {
  public readonly SERVICE_NAME = 'ocr';

  ocrTaskManager: TaskManager;

  constructor() {
    this.ocrTaskManager = new TaskManager({
      serviceName: this.SERVICE_NAME,
      processResults,
    });
  }

  start() {
    this.ocrTaskManager.subscribeToResults();
  }

  async stop() {
    await this.ocrTaskManager?.stop();
  }

  async addToQueue(file: EnforcedWithId<FileType>) {
    if (!file.filename) {
      return;
    }
    const settingsValues = await getSettings();

    await validateTaskIsAdmissible(file, settingsValues);

    const fileContent = await storage.fileContents(file.filename, 'document');
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
        language: getLanguage(file.language!, 'ISO639_1'),
      },
    });

    await createForFile(file);
  }
}

const ocrManager = new OcrManager();
export { ocrManager, OcrManager, isEnabled as isOcrEnabled, getStatus as getOcrStatus };
