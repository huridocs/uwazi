import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';

type CsvImportRowDBO = {
  _id?: ObjectId;
  importId: string;
  rowIndex: number;
  headers: string[];
  values: string[];
};

export class MongoCsvImportRowsDataSource
  extends MongoDataSource<CsvImportRowDBO>
  implements CsvImportRowsDataSource
{
  protected collectionName = 'csv_import_rows';

  async insertMany(rows: CsvImportRow[]): Promise<void> {
    if (!rows.length) return;
    await this.getCollection().insertMany(rows.map(row => row.toObject()));
  }

  async countByImport(importId: string): Promise<number> {
    return this.getCollection().countDocuments({ importId });
  }

  async getByImport(importId: string, offset = 0, limit = 0): Promise<CsvImportRow[]> {
    const cursor = this.getCollection().find({ importId }).sort({ rowIndex: 1 }).skip(offset);
    if (limit > 0) cursor.limit(limit);
    const results = await cursor.toArray();
    return results.map(doc => {
      const { _id, ...rest } = doc;
      return CsvImportRow.fromObject(rest);
    });
  }

  async getByImportAndIndexes(importId: string, indexes: number[]): Promise<CsvImportRow[]> {
    if (!indexes.length) return [];
    const results = await this.getCollection()
      .find({ importId, rowIndex: { $in: indexes } })
      .sort({ rowIndex: 1 })
      .toArray();
    return results.map(doc => {
      const { _id, ...rest } = doc;
      return CsvImportRow.fromObject(rest);
    });
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.getCollection().deleteMany({ importId });
  }
}
