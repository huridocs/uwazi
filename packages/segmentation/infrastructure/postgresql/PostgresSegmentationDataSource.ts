import { SegmentationDataSource } from '../../application/contracts/SegmentationDataSource.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { PostgresSegmentationDAO } from './PostgresSegmentationDAO.js';
import { PostgresSegmentationMapper } from './PostgresSegmentationMapper.js';
import { PostgresSegmentationRow } from './PostgresSegmentationRow.js';

class PostgresSegmentationDataSource implements SegmentationDataSource {
  constructor(private readonly dao: PostgresSegmentationDAO) {}

  async create(segmentation: Segmentation): Promise<boolean> {
    return this.dao.insertForFile(PostgresSegmentationMapper.toRow(segmentation));
  }

  async getById(id: string): Promise<Segmentation | undefined> {
    return PostgresSegmentationDataSource.toDomain(
      await this.dao.rows().where({ _id: id }).first()
    );
  }

  async getByFileId(fileId: string): Promise<Segmentation | undefined> {
    return PostgresSegmentationDataSource.toDomain(
      await this.dao.rows().where({ file_id: fileId }).first()
    );
  }

  async getByFilename(filename: string): Promise<Segmentation | undefined> {
    return PostgresSegmentationDataSource.toDomain(
      await this.dao.rows().where({ filename }).first()
    );
  }

  async save(segmentation: Segmentation): Promise<void> {
    await this.dao.updateExisting(PostgresSegmentationMapper.toRow(segmentation));
  }

  async nextIdleBatch(limit: number, afterId?: string): Promise<Segmentation[]> {
    let query = this.dao.rows().where({ status: SegmentationStatus.IDLE });
    if (afterId) {
      query = query.whereRaw('"_id" > ?', [afterId]);
    }
    const rows = await query.orderBy('_id').limit(limit).all();
    return rows.map(PostgresSegmentationMapper.toDomain);
  }

  async staleProcessing(requestedBefore: number, limit: number): Promise<Segmentation[]> {
    const rows = await this.dao
      .rows()
      .where({ status: SegmentationStatus.PROCESSING })
      .whereRaw('"requested_at" < ?', [requestedBefore])
      .limit(limit)
      .all();
    return rows.map(PostgresSegmentationMapper.toDomain);
  }

  async deleteByFileIds(fileIds: string[]): Promise<Segmentation[]> {
    if (!fileIds.length) {
      return [];
    }
    const deleted = await this.dao.deleteWhereIn('file_id', fileIds);
    return deleted.map(PostgresSegmentationMapper.toDomain);
  }

  private static toDomain(row: PostgresSegmentationRow | undefined) {
    return row ? PostgresSegmentationMapper.toDomain(row) : undefined;
  }
}

export { PostgresSegmentationDataSource };
