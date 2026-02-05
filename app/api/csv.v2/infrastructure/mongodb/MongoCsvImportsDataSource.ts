import { ObjectId } from 'mongodb';
import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { Result, ResultType } from 'api/core/libs/Result';
import { CsvImportDoesNotExistError } from '../../domain/csvImporErrors';
import { CsvImport } from '../../domain/CsvImport';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource';
import { CsvImportMapper } from './CsvImportMapper';
import { CsvImportDBO } from '../schemas/CsvImportTypes';

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
