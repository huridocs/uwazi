import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { CsvImportDoesNotExistError } from '#api/csv.v2/domain/csvImporErrors.js';
import { CsvImport } from '#api/csv.v2/domain/CsvImport.js';
import { CsvImportsDataSource } from '#api/csv.v2/application/contracts/CsvImportsDataSource.js';
import { CsvImportMapper } from '#api/csv.v2/infrastructure/mongodb/CsvImportMapper.js';
import { CsvImportDBO } from '#api/csv.v2/infrastructure/schemas/CsvImportTypes.js';

export class MongoCsvImportsDataSource
  extends MongoDataSource<CsvImportDBO>
  implements CsvImportsDataSource
{
  protected collectionName = 'csv_imports';

  async insert(doc: CsvImport) {
    const dbo: CsvImportDBO = CsvImportMapper.toDBO(doc);
    await this.getCollection().insertOne({ ...dbo, _id: new ObjectId(doc.id) });
  }

  async update(doc: CsvImport) {
    const dbo: CsvImportDBO = CsvImportMapper.toDBO(doc);
    await this.getCollection().updateOne({ _id: new ObjectId(doc.id) }, { $set: dbo });
  }

  async getById(id: string): Promise<ResultType<CsvImport, CsvImportDoesNotExistError>> {
    const result = await this.getCollection().findOne({ _id: new ObjectId(id) });
    if (!result) {
      return Result.fail(new CsvImportDoesNotExistError(id));
    }
    return Result.ok(CsvImportMapper.toDomain(result));
  }
}
