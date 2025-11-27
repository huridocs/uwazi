import { ObjectId } from 'mongodb';
import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource';
import { CsvImportRow } from '../../domain/CsvImportRow';

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
    await this.getCollection().insertMany(rows.map(r => ({ ...r })));
  }

  async countByImport(importId: string): Promise<number> {
    return this.getCollection().countDocuments({ importId });
  }

  async getByImport(importId: string, offset = 0, limit = 0): Promise<CsvImportRow[]> {
    const cursor = this.getCollection().find({ importId }).sort({ index: 1 }).skip(offset);
    if (limit > 0) cursor.limit(limit);
    const results = await cursor.toArray();
    return results.map(({ _id, ...rest }) => rest as CsvImportRow);
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.getCollection().deleteMany({ importId });
  }
}
