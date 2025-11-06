import { Db, ObjectId } from 'mongodb';
import { CsvImport, CsvImportStorage } from '../model/CsvImport';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportMapper } from './CsvImportMapper';
import { CsvImportDBO } from './schemas/CsvImportTypes';

export class MongoCsvImportsDataSource implements CsvImportsDataSource {
  private collection;

  constructor(private db: Db) {
    this.collection = this.db.collection('csv_imports');
  }

  async insert(doc: Omit<CsvImport, 'id'>): Promise<CsvImport> {
    const dbo: CsvImportDBO = CsvImportMapper.toDBO(doc);
    const result = await this.collection.insertOne(dbo);
    return CsvImportMapper.toDomain({ ...dbo, _id: result.insertedId });
  }

  async setStorage(importId: string, storage: CsvImportStorage): Promise<void> {
    await this.collection.updateOne(
      { _id: new ObjectId(importId) },
      { $set: { storage, updatedAt: Date.now() } }
    );
  }

  async getById(importId: string): Promise<CsvImport | undefined> {
    const result = await this.collection.findOne({ _id: new ObjectId(importId) });
    if (!result) return undefined;
    const { _id, ...rest } = result as any;
    return { id: _id.toString(), ...(rest as Omit<CsvImport, 'id'>) };
  }
}
