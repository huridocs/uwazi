import { ObjectId } from 'mongodb';
import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { CsvImport } from '../model/CsvImport';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportMapper } from './CsvImportMapper';
import { CsvImportDBO } from './schemas/CsvImportTypes';

export class MongoCsvImportsDataSource
  extends MongoDataSource<CsvImportDBO>
  implements CsvImportsDataSource
{
  protected collectionName = 'csv_imports';

  async insert(doc: CsvImport) {
    const { id, ...rest } = doc;
    const dbo: CsvImportDBO = CsvImportMapper.toDBO(rest as Omit<CsvImport, 'id'>);
    await this.getCollection().insertOne({ ...dbo, _id: new ObjectId(id) });
  }

  async update(doc: CsvImport) {
    const { id, ...rest } = doc;
    const dbo: CsvImportDBO = CsvImportMapper.toDBO(rest as Omit<CsvImport, 'id'>);
    await this.getCollection().updateOne({ _id: new ObjectId(id) }, { $set: dbo });
  }

  async getById(id: string) {
    const result = await this.getCollection().findOne({ _id: new ObjectId(id) });
    if (!result) return undefined;
    const { _id, ...rest } = result;
    return { id: _id.toString(), ...(rest as Omit<CsvImport, 'id'>) };
  }
}
