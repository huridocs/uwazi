import { Db, MongoServerError } from 'mongodb';
import { MongoSlotsDAO, SlotDocument } from './MongoSlotsDAO.js';
import { AmountPerSlotType, SlotBootstrapDefinitions } from './SlotBootstrapDefinitions.js';

type Deps = {
  database: Db;
};

class MongoSlotsBootstrapper {
  private static collectionName = MongoSlotsDAO.collectionName;

  constructor(private deps: Deps) {}

  async executeAll() {
    await this.createSlots();
    await this.createIndexes();
  }

  private get collection() {
    return this.deps.database.collection(MongoSlotsBootstrapper.collectionName);
  }

  async createSlots() {
    try {
      const slotsToCreate = SlotBootstrapDefinitions.slotList().flatMap(slotType =>
        Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
          type: SlotBootstrapDefinitions.toPropertyType(slotType),
          slotName: SlotBootstrapDefinitions.createSlotName(slotType, index + 1),
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

  async createIndexes() {
    await this.collection.createIndex({ slotName: 1 }, { unique: true });
    await this.collection.createIndex(
      { assignedTo: 1 },
      { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
    );
  }
}

export { MongoSlotsBootstrapper };
