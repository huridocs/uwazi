import { ObjectId } from 'mongodb';
import { LanguageUtils } from '#shared/language/index.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { OcrStatus } from '../../domain/OcrStatus.js';
import { MongoOcrRecordDBO } from './MongoOcrRecordDBO.js';

class MongoOcrRecordMapper {
  static toDomain(dbo: MongoOcrRecordDBO): OcrRecord {
    return new OcrRecord({
      id: dbo._id.toHexString(),
      sourceFileId: dbo.sourceFile?.toHexString() ?? null,
      filename: dbo.filename,
      language: LanguageUtils.fromISO639_3(dbo.language).ISO639_1!,
      status: dbo.status as OcrStatus,
      attempt: dbo.attempt,
      requestedAt: dbo.requestedAt,
      lastUpdated: dbo.lastUpdated,
      resultFileId: dbo.resultFile?.toHexString(),
      failureReason: dbo.failureReason as OcrFailureReason | undefined,
    });
  }

  static toDBO(record: OcrRecord): MongoOcrRecordDBO {
    return {
      _id: new ObjectId(record.id),
      sourceFile: record.sourceFileId === null ? null : new ObjectId(record.sourceFileId),
      filename: record.filename,
      language: LanguageUtils.fromISO639_1(record.language).ISO639_3,
      status: record.status,
      attempt: record.attempt,
      lastUpdated: record.lastUpdated,
      ...(record.resultFileId !== undefined && { resultFile: new ObjectId(record.resultFileId) }),
      ...(record.requestedAt !== undefined && { requestedAt: record.requestedAt }),
      ...(record.failureReason !== undefined && { failureReason: record.failureReason }),
    };
  }
}

export { MongoOcrRecordMapper };
