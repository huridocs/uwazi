import { Db } from 'mongodb';
import { MongoSlotsDAO, SlotDocument } from './MongoSlotsDAO.js';
import { AmountPerSlotType, SlotBootstrapDefinitions } from './SlotBootstrapDefinitions.js';
import { config } from '#api/config.js';
import type { SlotType } from './SlotType.js';

type Deps = {
  database: Db;
  slotsDAO: MongoSlotsDAO;
  amountPerSlotType?: Record<SlotType, number>;
};

class MongoSlotsBootstrapper {
  private get amounts(): Record<SlotType, number> {
    return this.deps.amountPerSlotType ?? AmountPerSlotType;
  }

  constructor(private deps: Deps) {}

  async execute() {
    await this.createSlots();
    await this.createIndexes();
    await this.createSentinel();
  }

  private get rawCollection() {
    return this.deps.database.collection(MongoSlotsDAO.collectionName);
  }

  async createSlots() {
    const slotsToCreate = SlotBootstrapDefinitions.slotList().flatMap(slotType =>
      Array.from({ length: this.amounts[slotType] }, (_, index) => ({
        type: slotType,
        slotName: SlotBootstrapDefinitions.createSlotName(slotType, index + 1),
        assignedTo: null,
        language: null,
        rand: Math.random(),
      }))
    ) as Omit<SlotDocument, '_id'>[];

    await this.deps.slotsDAO.getCollection().bulkWrite(
      slotsToCreate.map(slot => ({
        updateOne: {
          filter: { slotName: slot.slotName },
          update: { $setOnInsert: slot },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  async createIndexes() {
    // For unique constraint on slotName
    await this.rawCollection.createIndex({ slotName: 1 }, { unique: true });

    // For ensuring a slot is only assigned to one (property, language) pair at a time
    await this.rawCollection.createIndex(
      { assignedTo: 1, language: 1 },
      { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
    );

    // For speeding query slot retrieval
    await this.rawCollection.createIndex(
      { type: 1, rand: 1 },
      { partialFilterExpression: { assignedTo: null } }
    );
  }

  async createSentinel() {
    await this.rawCollection.updateOne(
      { _id: MongoSlotsDAO.sentinelId as any },
      { $setOnInsert: { version: 0 } },
      { upsert: true }
    );
  }

  async reset(): Promise<void> {
    if (config.ENVIRONMENT === 'production') {
      throw new Error('MongoSlotsBootstrapper.reset() is not allowed in production');
    }

    await this.rawCollection.drop().catch(err => {
      if (err?.codeName !== 'NamespaceNotFound') throw err;
    });
    await this.execute();
  }
}

export { MongoSlotsBootstrapper };
