import { LanguageUtils } from '#shared/language/index.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { OcrStatus } from '../../domain/OcrStatus.js';
import { PostgresOcrRecordRow } from './PostgresOcrRecordRow.js';

class PostgresOcrRecordMapper {
  static toDomain(row: PostgresOcrRecordRow): OcrRecord {
    return new OcrRecord({
      id: row._id,
      sourceFileId: row.source_file_id ?? null,
      filename: row.filename,
      language: LanguageUtils.fromISO639_3(row.language).ISO639_1!,
      status: row.status as OcrStatus,
      attempt: Number(row.attempt),
      requestedAt: row.requested_at === undefined ? undefined : Number(row.requested_at),
      lastUpdated: Number(row.last_updated),
      resultFileId: row.result_file_id,
      failureReason: row.failure_reason as OcrFailureReason | undefined,
    });
  }

  /** Every column, with null for what the record lacks, so an update clears it too. */
  static toRow(record: OcrRecord): Record<string, unknown> {
    return {
      _id: record.id,
      source_file_id: record.sourceFileId,
      result_file_id: record.resultFileId ?? null,
      filename: record.filename,
      language: LanguageUtils.fromISO639_1(record.language).ISO639_3,
      status: record.status,
      attempt: record.attempt,
      requested_at: record.requestedAt ?? null,
      last_updated: record.lastUpdated,
      failure_reason: record.failureReason ?? null,
    };
  }
}

export { PostgresOcrRecordMapper };
