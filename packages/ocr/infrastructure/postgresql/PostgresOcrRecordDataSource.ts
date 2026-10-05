import { OcrRecordDataSource } from '../../application/contracts/OcrRecordDataSource.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { OcrStatus } from '../../domain/OcrStatus.js';
import { PostgresOcrRecordDAO } from './PostgresOcrRecordDAO.js';
import { PostgresOcrRecordMapper } from './PostgresOcrRecordMapper.js';
import { PostgresOcrRecordRow } from './PostgresOcrRecordRow.js';

class PostgresOcrRecordDataSource implements OcrRecordDataSource {
  constructor(private readonly deps: { dao: PostgresOcrRecordDAO }) {}

  async create(record: OcrRecord): Promise<boolean> {
    return this.deps.dao.insertForSource(PostgresOcrRecordMapper.toRow(record));
  }

  async getById(id: string): Promise<OcrRecord | undefined> {
    return PostgresOcrRecordDataSource.toDomain(
      await this.deps.dao.rows().where({ _id: id }).first()
    );
  }

  async getBySourceFileId(fileId: string): Promise<OcrRecord | undefined> {
    return PostgresOcrRecordDataSource.toDomain(
      await this.deps.dao.rows().where({ source_file_id: fileId }).first()
    );
  }

  async getByFilename(filename: string): Promise<OcrRecord | undefined> {
    return PostgresOcrRecordDataSource.toDomain(
      await this.deps.dao
        .rows()
        .where({ filename })
        .whereRaw('"source_file_id" IS NOT NULL')
        .first()
    );
  }

  async save(record: OcrRecord): Promise<void> {
    await this.deps.dao.updateExisting(PostgresOcrRecordMapper.toRow(record));
  }

  async staleProcessing(requestedBefore: number, limit: number): Promise<OcrRecord[]> {
    const rows = await this.deps.dao
      .rows()
      .where({ status: OcrStatus.PROCESSING })
      .whereRaw('"requested_at" < ?', [requestedBefore])
      .limit(limit)
      .all();
    return rows.map(PostgresOcrRecordMapper.toDomain);
  }

  async getForFiles(fileIds: string[]): Promise<OcrRecord[]> {
    if (!fileIds.length) {
      return [];
    }
    const rows = await this.deps.dao
      .rows()
      .whereRaw(
        `"source_file_id" IN (${fileIds.map(() => '?').join(', ')})
          OR "result_file_id" IN (${fileIds.map(() => '?').join(', ')})`,
        [...fileIds, ...fileIds]
      )
      .all();
    return rows.map(PostgresOcrRecordMapper.toDomain);
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length) {
      await this.deps.dao.rows().whereIn('_id', ids).delete();
    }
  }

  private static toDomain(row: PostgresOcrRecordRow | undefined) {
    return row ? PostgresOcrRecordMapper.toDomain(row) : undefined;
  }
}

export { PostgresOcrRecordDataSource };
