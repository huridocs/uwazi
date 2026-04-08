import { MongoSlotsDAO } from './MongoSlotsDAO.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

type Deps = {
  slotsDAO: MongoSlotsDAO;
  templatesDAO: MongoTemplatesDAO;
};

class SlotsReconciler {
  constructor(private deps: Deps) {}

  async execute(): Promise<void> {
    const snapshotVersion = await this.deps.slotsDAO.getSentinelVersion();

    const allProperties = await this.deps.templatesDAO.getAllProperties();

    const desired = new Map<string, PropertyType>();
    allProperties.forEach(({ name, type }) => desired.set(name, type));

    const assignedSlots = await this.deps.slotsDAO.getSlotMap();

    await ArrayUtils.parallelFor(
      [...desired.entries()],
      async ([propertyName, type]) =>
        assignedSlots.has(propertyName) || this.deps.slotsDAO.assignSlot({ propertyName, type })
    );

    await ArrayUtils.parallelFor(
      [...assignedSlots.keys()],
      async name => !desired.has(name) && this.deps.slotsDAO.unassignSlot(name)
    );

    await this.deps.slotsDAO.touchSentinel(snapshotVersion);
  }
}

export { SlotsReconciler };
