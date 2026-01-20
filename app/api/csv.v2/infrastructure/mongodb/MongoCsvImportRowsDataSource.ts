import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { CsvImportRowsDataSource } from '#api/csv.v2/application/contracts/CsvImportRowsDataSource.js';
import { CsvImportRow } from '#api/csv.v2/domain/CsvImportRow.js';

type CsvImportRowDBO = {
  _id?: ObjectId;
  importId: string;
  index: number;
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
    const cursor = this.getCollection().find({ importId }).sort({ index: 1 }).skip(offset);
    if (limit > 0) cursor.limit(limit);
    const results = await cursor.toArray();
    return results.map(doc => {
      const { _id, ...rest } = doc;
      return CsvImportRow.fromObject(rest);
    });
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.getCollection().deleteMany({ importId });
  }
}
