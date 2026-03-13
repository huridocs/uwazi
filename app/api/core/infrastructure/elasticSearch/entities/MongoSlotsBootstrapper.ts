import { Db } from 'mongodb';
import { MongoSlotsDataSource, SlotDocument } from './MongoSlotsDataSource';

type Deps = {
  database: Db;
};

class MongoSlotsBootstrapper {
  private static collectionName = MongoSlotsDataSource.collectionName;

  constructor(private deps: Deps) {}

  async execute() {
    await this.createIndexes();
  }

  private get collection() {
    return this.deps.database.collection<SlotDocument>(MongoSlotsBootstrapper.collectionName);
  }

  private async createSlots() {}

  private async createIndexes() {
    await this.collection.createIndex({ slotName: 1 }, { unique: true });
    await this.collection.createIndex(
      { assignedTo: 1 },
      { unique: true, partialFilterExpression: { assignedTo: { $ne: null } } }
    );
  }
}

export { MongoSlotsBootstrapper };
