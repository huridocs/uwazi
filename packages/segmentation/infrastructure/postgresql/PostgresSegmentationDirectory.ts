import {
  SegmentationDirectory,
  SegmentationReadModel,
  SegmentationStatusReadModel,
} from '../../application/contracts/SegmentationDirectory.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { SegmentationReadModelMapper } from '../SegmentationReadModelMapper.js';
import { PostgresSegmentationDAO } from './PostgresSegmentationDAO.js';
import { PostgresSegmentationMapper } from './PostgresSegmentationMapper.js';
import { PostgresSegmentationRow } from './PostgresSegmentationRow.js';

class PostgresSegmentationDirectory implements SegmentationDirectory {
  constructor(private readonly deps: { dao: PostgresSegmentationDAO }) {}

  async readyByFileIds(fileIds: string[]): Promise<SegmentationReadModel[]> {
    if (!fileIds.length) {
      return [];
    }
    return PostgresSegmentationDirectory.readModels(
      await this.ready().whereIn('file_id', fileIds).all()
    );
  }

  async readyByFilenames(filenames: string[]): Promise<SegmentationReadModel[]> {
    if (!filenames.length) {
      return [];
    }
    return PostgresSegmentationDirectory.readModels(
      await this.ready().whereIn('filename', filenames).all()
    );
  }

  async fileIdForXml(xmlFilename: string): Promise<string | undefined> {
    const row = await this.deps.dao
      .rows()
      .where({ xml_filename: xmlFilename })
      .select(['file_id'])
      .first();
    return row?.file_id;
  }

  async readyFileIds(): Promise<string[]> {
    const rows = await this.ready().select(['file_id']).all();
    return rows.map(row => row.file_id);
  }

  async statusesByFileIds(fileIds: string[]): Promise<SegmentationStatusReadModel[]> {
    if (!fileIds.length) {
      return [];
    }
    const rows = await this.deps.dao
      .rows()
      .whereIn('file_id', fileIds)
      .select(['file_id', 'status'])
      .all();
    return rows.map(row => ({ fileId: row.file_id, status: row.status as SegmentationStatus }));
  }

  private ready() {
    return this.deps.dao.rows().where({ status: SegmentationStatus.READY });
  }

  private static readModels(rows: PostgresSegmentationRow[]) {
    return rows.map(row =>
      SegmentationReadModelMapper.toReadModel(PostgresSegmentationMapper.toDomain(row))
    );
  }
}

export { PostgresSegmentationDirectory };
