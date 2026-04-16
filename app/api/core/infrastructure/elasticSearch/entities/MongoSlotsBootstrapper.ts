import { Db, MongoServerError } from 'mongodb';
import { MongoSlotsDAO, SlotDocument } from './MongoSlotsDAO.js';
import { AmountPerSlotType, SlotBootstrapDefinitions } from './SlotBootstrapDefinitions.js';

type Deps = {
  database: Db;
};

class MongoSlotsBootstrapper {
  private static collectionName = MongoSlotsDAO.collectionName;

  constructor(private deps: Deps) {}

  async execute() {
    await this.createSlots();
    await this.createIndexes();
    await this.createSentinel();
  }

  private get collection() {
    return this.deps.database.collection(MongoSlotsBootstrapper.collectionName);
  }

  async createSlots() {
    try {
      const slotsToCreate = SlotBootstrapDefinitions.slotList().flatMap(slotType =>
        Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
          type: slotType,
          slotName: SlotBootstrapDefinitions.createSlotName(slotType, index + 1),
          assignedTo: null,
          rand: Math.random(),
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
    // For unique constraint on slotName
    await this.collection.createIndex({ slotName: 1 }, { unique: true });

    // For ensuring a slot is only assigned to one property at a time
    await this.collection.createIndex(
      { assignedTo: 1 },
      { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
    );

    // For speeding query slot retrieval
    await this.collection.createIndex(
      { type: 1, rand: 1 },
      { partialFilterExpression: { assignedTo: null } }
    );
  }

  async createSentinel() {
    await this.collection.updateOne(
      { _id: MongoSlotsDAO.sentinelId as any },
      { $setOnInsert: { version: 0 } },
      { upsert: true }
    );
  }
}

export { MongoSlotsBootstrapper };
