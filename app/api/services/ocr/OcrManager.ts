import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import urljoin from 'url-join';
import { files, storage } from '#api/files/index.js';

import relationships from '#api/relationships/index.js';

import { ResultsMessage, TaskManager } from '#api/services/tasksmanager/TaskManager.js';

import settings from '#api/settings/settings.js';

import { emitToTenant } from '#api/socketio/setupSockets.js';

import createError from '#api/utils/Error.js';

import { handleError } from '#api/utils/handleError.js';

import { LanguageUtils } from '#shared/language/index.js';
import request from '#shared/JSONRequest.js';

import { FileType } from '#shared/types/fileType.js';
import { ProcessingPDF } from '#api/core/domain/files/ProcessingPDF.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import users from '#api/users/users.js';
import { EnforcedWithId } from '#api/odm/model.js';
import { OcrRecord, OcrStatus } from '#api/services/ocr/ocrModel.js';
import {
  createForFile,
  getForSourceFile,
  getForSourceOrTargetFile,
  markError,
  markReady,
} from '#api/services/ocr/ocrRecords.js';

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

const setUserContextForFile = async (file: FileType): Promise<void> => {
  if (!file.entity) {
    throw new Error(`OCR cannot process file ${file.filename}: file has no entity association`);
  }

  const db = getConnection();
  const entity = await db
    .collection<EntityDBO>('entities')
    .findOne({ sharedId: file.entity }, { projection: { user: 1, sharedId: 1 } });

  if (!entity) {
    throw new Error(`OCR cannot process file ${file.filename}: entity ${file.entity} not found`);
  }

  if (!entity.user) {
    throw new Error(`OCR cannot process file ${file.filename}: entity ${file.entity} has no user`);
  }

  const user = await users.getById(entity.user.toString(), '-password', true);
  if (!user) {
    throw new Error(`OCR cannot process file ${file.filename}: user ${entity.user} not found`);
  }

  permissionsContext.setUserInContext(user);
};

const saveResultFile = async (message: ResultsMessage, originalFile: FileType) => {
  const fileResponse = await fetch(message.file_url!);
  const fileStream = fileResponse.body as unknown as Readable;
  if (!fileStream) {
    throw new Error(
      `Error requesting for OCR file: ${message.params!.filename}, tenant: ${message.tenant}`
    );
  }

  const inputFile = await InputFile.fromStream({
    stream: fileStream,
    originalname: `ocr_${originalFile.originalname}`,
    mimetype: fileResponse.headers.get('Content-Type')!,
    type: 'document',
  });

  const fileId = IdGeneratorFactory.default().generate();
  const processingPDF = inputFile.toEntityFile(originalFile.entity!, fileId) as ProcessingPDF;

  const transactionManager = TransactionManagerFactory.default();
  const filesService = FilesServiceFactory.default(transactionManager);

  await filesService.storeFiles([processingPDF]);

  await transactionManager.run(async () => {
    await filesService.insert([processingPDF]);
  });

  return {
    ...processingPDF.toDTO(),
    _id: new ObjectId(processingPDF.id),
    __v: 0,
  };
};

const processFiles = async (
  record: OcrRecord,
  message: ResultsMessage,
  originalFile: EnforcedWithId<FileType>
) => {
  try {
    await setUserContextForFile(originalFile);

    const resultFile = await saveResultFile(message, originalFile);

    await files.save({ _id: originalFile._id, type: 'attachment' });

    await markReady(record, resultFile as EnforcedWithId<FileType>);
    await relationships.swapTextReferencesFile(
      originalFile._id.toHexString(),
      resultFile._id.toHexString()
    );
  } catch (error) {
    await markError(record);
    throw error;
  }
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
  return supportedLanguages.includes(LanguageUtils.fromISO639_3(language)?.ISO639_1!);
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
        language: LanguageUtils.fromISO639_3(file.language!)?.ISO639_1,
      },
    });

    await createForFile(file);
  }
}

let manager: OcrManager;

const ocrManager = () => {
  if (!manager) {
    manager = new OcrManager();
  }
  return manager;
};
export { getStatus as getOcrStatus, isEnabled as isOcrEnabled, ocrManager, OcrManager };
