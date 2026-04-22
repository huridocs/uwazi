import { MongoSlotsDAO } from './MongoSlotsDAO.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

type Deps = {
  slotsDAO: MongoSlotsDAO;
  templatesDAO: MongoTemplatesDAO;
};

class SlotsReconciler {
  constructor(private deps: Deps) {}

  async execute(): Promise<void> {
    const snapshotVersion = await this.deps.slotsDAO.getSentinelVersion();

    const allProperties = await this.deps.templatesDAO.getAllFilterableProperties();

    const assignedSlots = await this.deps.slotsDAO.getSlotMap();
    const assignedPropertyNames = new Set([...assignedSlots.values()].map(slot => slot.assignedTo));

    await ArrayUtils.parallelFor(allProperties, async ({ type, inheritedType, name }) =>
      this.deps.slotsDAO.assignSlot({ propertyName: name, propertyType: type, inheritedType })
    );

    await ArrayUtils.parallelFor(
      [...assignedPropertyNames],
      async name =>
        !allProperties.some(prop => prop.name === name) && this.deps.slotsDAO.unassignSlot(name)
    );

    await this.deps.slotsDAO.touchSentinel(snapshotVersion);
  }
}

export { SlotsReconciler };
