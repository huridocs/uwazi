import { Db, MongoServerError, ObjectId } from 'mongodb';
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

type UpdatePropertyNameInput = {
  oldName: string;
  newName: string;
};

type SlotMap = Map<string, SlotDocument>;

const slotsCache = new Map<string, SlotMap>();

class MongoSlotsDAO extends MongoDataSource<SlotDocument> {
  static collectionName = 'elasticSlots';

  private readonly tenantName: string;

  protected collectionName = MongoSlotsDAO.collectionName;

  constructor(db: Db, transactionManager: MongoTransactionManager, tenantName: string) {
    super(db, transactionManager);
    this.tenantName = tenantName;
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
        throw new Error(`Property "${propertyName}" is already assigned to a slot`);
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

  async updatePropertyName({ oldName, newName }: UpdatePropertyNameInput) {
    const result = await this.getCollection().updateOne(
      {
        assignedTo: oldName,
      },
      {
        $set: {
          assignedTo: newName,
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error(`No slot found with property name ${oldName}`);
    }

    this.invalidateCache();
  }

  async getAssignedSlots() {
    return this.getCollection()
      .find({ assignedTo: { $ne: null } })
      .toArray();
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
export type { SlotDocument, SlotMap };
