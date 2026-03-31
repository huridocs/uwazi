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
};

type UpdatePropertyNameInput = {
  oldName: string;
  newName: string;
};

class MongoSlotsDataSource extends MongoDataSource<SlotDocument> {
  static collectionName = 'elasticSlots';

  protected collectionName = MongoSlotsDataSource.collectionName;

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

  async updatePropertyName({ oldName, newName }: UpdatePropertyNameInput) {
    const result = await this.getCollection().updateOne(
      {
        slotName: oldName,
      },
      {
        $set: {
          slotName: newName,
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error(`No slot found with property name ${oldName}`);
    }
  }

  async getAssignedSlots() {
    return this.getCollection()
      .find({ assignedTo: { $ne: null } })
      .toArray();
  }
}

export { MongoSlotsDataSource };
export type { SlotDocument };
