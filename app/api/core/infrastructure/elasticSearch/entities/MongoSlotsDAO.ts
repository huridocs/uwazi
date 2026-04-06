import { MongoServerError, ObjectId } from 'mongodb';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';

type SlotDocument = {
  _id: ObjectId;
  type: PropertyType;
  slotName: string;
  assignedTo: string | null;
};

type AssignSlotInput = {
  propertyName: string;
  type: PropertyType;
  tenantId?: string;
};

type UpdatePropertyNameInput = {
  oldName: string;
  newName: string;
  tenantId?: string;
};

type SlotMap = Map<string, string>;

const slotsCache = new Map<string, SlotMap>();

class MongoSlotsDAO extends MongoDataSource<SlotDocument> {
  static collectionName = 'elasticSlots';

  protected collectionName = MongoSlotsDAO.collectionName;

  static clearCache() {
    slotsCache.clear();
  }

  async assignSlot({ propertyName, type, tenantId }: AssignSlotInput) {
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

    if (tenantId) {
      this.invalidateCache(tenantId);
    }
  }

  async unassignSlot(propertyName: string, tenantId?: string) {
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

    if (tenantId) {
      this.invalidateCache(tenantId);
    }
  }

  async updatePropertyName({ oldName, newName, tenantId }: UpdatePropertyNameInput) {
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

    if (tenantId) {
      this.invalidateCache(tenantId);
    }
  }

  async getAssignedSlots() {
    return this.getCollection()
      .find({ assignedTo: { $ne: null } })
      .toArray();
  }

  async getSlotMap(tenantId: string): Promise<SlotMap> {
    const cached = slotsCache.get(tenantId);
    if (cached) {
      return cached;
    }

    const assignedSlots = await this.getAssignedSlots();
    const slotMap: SlotMap = new Map();

    assignedSlots.forEach(slot => {
      if (slot.assignedTo !== null) {
        slotMap.set(slot.assignedTo, slot.slotName);
      }
    });

    slotsCache.set(tenantId, slotMap);

    return slotMap;
  }

  invalidateCache(tenantId: string) {
    slotsCache.delete(tenantId);
  }
}

export { MongoSlotsDAO };
export type { SlotDocument, SlotMap };
