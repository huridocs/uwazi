import { Db, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { OptimisticLockError } from '../../mongodb/common/OptimisticLockError.js';

type SlotDocument = {
  _id: ObjectId;
  type: PropertyType;
  slotName: string;
  assignedTo: string | null;
};

type AssignedSlotDocument = SlotDocument & { assignedTo: string };

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

class MongoSlotsDAO extends MongoDataSource<SlotDocument> {
  static collectionName = 'elasticSlots';

  static sentinelId = 'reconcile_sentinel' as unknown as ObjectId;

  private static cache = new Map<string, SlotMap>();

  private readonly tenantName: string;

  protected collectionName = MongoSlotsDAO.collectionName;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
    this.tenantName = deps.tenantName;

    deps.transactionManager.onCommitted(async () => this.invalidateCache());
  }

  static clearCache() {
    MongoSlotsDAO.cache.clear();
  }

  invalidateCache() {
    MongoSlotsDAO.cache.delete(this.tenantName);
  }

  async assignSlot({ propertyName, type }: AssignSlotInput) {
    const slots = await this.getSlotMap();
    if (slots.has(propertyName)) return;

    const result = await this.getCollection().updateOne(
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

    if (result.modifiedCount === 0) {
      throw new Error(`No available slots for type ${type}`);
    }
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
  }

  private async getAssignedSlots() {
    return this.getCollection()
      .find({ assignedTo: { $ne: null } })
      .toArray() as Promise<AssignedSlotDocument[]>;
  }

  async getSentinelVersion(): Promise<number> {
    const doc = await this.getCollection().findOne({
      _id: MongoSlotsDAO.sentinelId,
    });

    return (doc as any)?.version ?? 0;
  }

  async touchSentinel(expectedVersion: number): Promise<void> {
    const result = await this.getCollection().updateOne(
      { _id: MongoSlotsDAO.sentinelId, version: expectedVersion } as any,
      { $inc: { version: 1 } } as UpdateFilter<SlotDocument>
    );

    if (result.modifiedCount === 0) {
      throw new OptimisticLockError({
        resourceName: 'Slots',
        expectedVersion,
        resourceId: MongoSlotsDAO.sentinelId.toString(),
      });
    }
  }

  async getSlotMap(): Promise<SlotMap> {
    const cached = MongoSlotsDAO.cache.get(this.tenantName);
    if (cached) {
      return cached;
    }

    const assignedSlots = await this.getAssignedSlots();
    const slotMap: SlotMap = new Map();

    assignedSlots.forEach(slot => slotMap.set(slot.assignedTo, slot));

    MongoSlotsDAO.cache.set(this.tenantName, slotMap);

    return slotMap;
  }
}

export { MongoSlotsDAO };
export type { SlotDocument, SlotMap, AssignSlotInput };
