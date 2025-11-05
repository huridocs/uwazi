import { Db, ObjectId } from 'mongodb';
import { CsvImport, CsvImportStorage, CsvImportToCreate } from '../model/CsvImport';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';

export class MongoCsvImportsDataSource implements CsvImportsDataSource {
  private collection;

  constructor(private db: Db) {
    this.collection = this.db.collection('csv_imports');
  }

  async create(doc: CsvImportToCreate): Promise<CsvImport> {
    const result = await this.collection.insertOne({ ...doc });
    return { id: result.insertedId.toString(), ...doc };
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
