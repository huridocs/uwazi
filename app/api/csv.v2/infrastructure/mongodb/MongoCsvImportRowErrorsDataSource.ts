import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { CsvImportRowErrorsDataSource } from '../../application/contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportRowError } from '../../domain/CsvImportRowError.js';
import { CsvImportRowErrorDBO } from '../schemas/CsvImportRowErrorsTypes.js';
import { fromMongoIdentity, toMongoIdentity } from './mongoIdentity.js';

export class MongoCsvImportRowErrorsDataSource
  extends MongoDataSource<CsvImportRowErrorDBO>
  implements CsvImportRowErrorsDataSource
{
  protected collectionName = 'csv_import_row_errors';

  async insertMany(errors: CsvImportRowError[]): Promise<void> {
    if (!errors.length) return;
    await this.getCollection().insertMany(errors.map(error => toMongoIdentity(error.toObject())));
  }

  async countByImport(importId: string): Promise<number> {
    return this.getCollection().countDocuments({ importId });
  }

  async getByImport(importId: string): Promise<CsvImportRowError[]> {
    const results = await this.getCollection().find({ importId }).sort({ rowIndex: 1 }).toArray();
    return results.map(doc => CsvImportRowError.fromObject(fromMongoIdentity(doc)));
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.getCollection().deleteMany({ importId });
  }
}
