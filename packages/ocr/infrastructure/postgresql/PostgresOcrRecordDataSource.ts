import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { OcrRecordDataSource } from '../../application/contracts/OcrRecordDataSource.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { PostgresOcrRecordMapper } from './PostgresOcrRecordMapper.js';
import { PostgresOcrRecordRow } from './PostgresOcrRecordRow.js';

/** The `ocr_records` table; tenant isolation is its row-level security policy. */
class PostgresOcrRecordDataSource
  extends PostgresDataSource<PostgresOcrRecordRow>
  implements OcrRecordDataSource
{
  constructor(deps: PostgresDataSourceDeps) {
    super('ocr_records', deps);
  }

  async create(record: OcrRecord): Promise<boolean> {
    const row = PostgresOcrRecordMapper.toRow(record);
    if (row.source_file_id === null) {
      await this.table.insert(row);
      return true;
    }
    await this.table.upsert(row, {
      targetRaw: '("tenant_id", "source_file_id") WHERE "source_file_id" IS NOT NULL',
      ignore: true,
    });
    const stored = await this.table
      .query()
      .where({ source_file_id: row.source_file_id })
      .select(['_id'])
      .first();
    return stored?._id === row._id;
  }

  async getById(id: string): Promise<OcrRecord | undefined> {
    return PostgresOcrRecordDataSource.toDomain(
      await this.table.query().where({ _id: id }).first()
    );
  }

  async getBySourceFileId(fileId: string): Promise<OcrRecord | undefined> {
    return PostgresOcrRecordDataSource.toDomain(
      await this.table.query().where({ source_file_id: fileId }).first()
    );
  }

  async getByFilename(filename: string): Promise<OcrRecord | undefined> {
    return PostgresOcrRecordDataSource.toDomain(
      await this.table.query().where({ filename }).whereRaw('"source_file_id" IS NOT NULL').first()
    );
  }

  /** Updates a stored row; a row no longer there is not recreated. */
  async save(record: OcrRecord): Promise<void> {
    const { _id, ...columns } = PostgresOcrRecordMapper.toRow(record);
    await this.table.query().where({ _id }).update(columns);
  }

  async getForFiles(fileIds: string[]): Promise<OcrRecord[]> {
    if (!fileIds.length) {
      return [];
    }
    const rows = await this.table
      .query()
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
      await this.table.query().whereIn('_id', ids).delete();
    }
  }

  private static toDomain(row: PostgresOcrRecordRow | undefined) {
    return row ? PostgresOcrRecordMapper.toDomain(row) : undefined;
  }
}

export { PostgresOcrRecordDataSource };
