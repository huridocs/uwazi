import { Db, MongoServerError, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';

type SlotDocument = {
  _id: ObjectId;
  type: PropertyType;
  slotName: string;
  assignedTo: string | null;
};

type AssignSlotInput = {
  propertyName: string;
  type: PropertyType;
};

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
  tenantName: string;
};

type SlotMap = Map<string, SlotDocument>;

const slotsCache = new Map<string, SlotMap>();

class MongoSlotsDAO extends MongoDataSource<SlotDocument> {
  static collectionName = 'elasticSlots';

  static sentinelId = 'reconcile_sentinel';

  private readonly tenantName: string;

  protected collectionName = MongoSlotsDAO.collectionName;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
    this.tenantName = deps.tenantName;
  }

  static clearCache() {
    slotsCache.clear();
  }

  async assignSlot({ propertyName, type }: AssignSlotInput) {
    let result;
    try {
      result = await this.getCollection().updateOne(
        {
          assignedTo: null,
          type,
        },
        {
          $set: {
            assignedTo: propertyName,
          },
        }
      );
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        // Property is already assigned to a slot — valid no-op under reconciliation
        return;
      }
      throw error;
    }

    if (result.modifiedCount === 0) {
      throw new Error(`No available slots for type ${type}`);
    }

    this.invalidateCache();
  }

  async unassignSlot(propertyName: string) {
    await this.getCollection().updateOne(
      {
        assignedTo: propertyName,
      },
      {
        $set: {
          assignedTo: null,
        },
      }
    );

    this.invalidateCache();
  }

  async getAssignedSlots() {
    return this.getCollection()
      .find({ assignedTo: { $ne: null } })
      .toArray();
  }

  async touchSentinel() {
    await this.getCollection().updateOne(
      { _id: MongoSlotsDAO.sentinelId as unknown as ObjectId },
      { $inc: { version: 1 } } as UpdateFilter<SlotDocument>,
      { upsert: true }
    );
  }

  async getSlotMap(): Promise<SlotMap> {
    const cached = slotsCache.get(this.tenantName);
    if (cached) {
      return cached;
    }

    const assignedSlots = await this.getAssignedSlots();
    const slotMap: SlotMap = new Map();

    assignedSlots.forEach(slot => {
      if (slot.assignedTo !== null) {
        slotMap.set(slot.assignedTo, slot);
      }
    });

    slotsCache.set(this.tenantName, slotMap);

    return slotMap;
  }

  invalidateCache() {
    slotsCache.delete(this.tenantName);
  }
}

export { MongoSlotsDAO };
export type { SlotDocument, SlotMap, AssignSlotInput };
