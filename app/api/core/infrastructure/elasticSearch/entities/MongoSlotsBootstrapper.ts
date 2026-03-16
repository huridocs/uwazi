import { Db, MongoServerError } from 'mongodb';
import { MongoSlotsDataSource, SlotDocument } from './MongoSlotsDataSource';
import { AmountPerSlotType, SlotsMapper } from './SlotDefinition';

type Deps = {
  database: Db;
};

class MongoSlotsBootstrapper {
  private static collectionName = MongoSlotsDataSource.collectionName;

  constructor(private deps: Deps) {}

  async execute() {
    await this.createSlots();
    await this.createIndexes();
  }

  private get collection() {
    return this.deps.database.collection(MongoSlotsBootstrapper.collectionName);
  }

  private async createSlots() {
    try {
      const slotsToCreate = SlotsMapper.slotList().flatMap(slotType =>
        Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
          type: SlotsMapper.toPropertyType(slotType),
          slotName: SlotsMapper.createSlotName(slotType, index + 1),
          assignedTo: null,
        }))
      ) as Omit<SlotDocument, '_id'>[];

      await Promise.all(
        slotsToCreate.map(async slot =>
          this.collection.updateOne(
            { slotName: slot.slotName },
            {
              $setOnInsert: slot,
            },
            { upsert: true }
          )
        )
      );
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return;
      }
      throw error;
    }
  }

  private async createIndexes() {
    await this.collection.createIndex({ slotName: 1 }, { unique: true });
    await this.collection.createIndex(
      { assignedTo: 1 },
      { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
    );
  }
}

export { MongoSlotsBootstrapper };
