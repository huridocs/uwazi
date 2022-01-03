import { EnforcedWithId, WithId } from 'api/odm';
import { ensure } from 'shared/tsUtils';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import { OcrModel, OcrRecord, OcrStatus } from './ocrModel';

const createForFile = async (file: FileType) =>
  OcrModel.save({
    sourceFile: file._id,
    language: file.language,
    status: OcrStatus.PROCESSING,
    lastUpdated: Date.now(),
  });

const cleanupRecordsOfFiles = async (fileIds: (ObjectIdSchema | undefined)[]) => {
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
};

const markReady = async (record: OcrRecord, resultFile: EnforcedWithId<FileType>) =>
  OcrModel.save({
    ...record,
    status: OcrStatus.READY,
    resultFile: resultFile._id,
    lastUpdated: Date.now(),
  });

const markError = async (record: OcrRecord) =>
  OcrModel.save({
    ...record,
    status: OcrStatus.ERROR,
    lastUpdated: Date.now(),
  });

const getForSourceFile = async (file: EnforcedWithId<FileType>) =>
  OcrModel.get({ sourceFile: file._id });

const getForSourceOrTargetFile = async (file: EnforcedWithId<FileType>) =>
  OcrModel.get({
    $or: [{ sourceFile: file._id }, { resultFile: file._id }],
  });

export {
  createForFile,
  cleanupRecordsOfFiles,
  markReady,
  markError,
  getForSourceFile,
  getForSourceOrTargetFile,
};
