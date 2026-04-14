import { MongoSlotsDAO } from './MongoSlotsDAO.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import type { PropertyDescriptor } from '../../mongodb/template/MongoTemplatesDAO.js';

type Deps = {
  slotsDAO: MongoSlotsDAO;
  templatesDAO: MongoTemplatesDAO;
};

class SlotsReconciler {
  constructor(private deps: Deps) {}

  async execute(): Promise<void> {
    const snapshotVersion = await this.deps.slotsDAO.getSentinelVersion();

    const allProperties = await this.deps.templatesDAO.getAllProperties();

    const desired = new Map<string, PropertyDescriptor>();
    allProperties.forEach(({ name, type, inheritedType }) =>
      desired.set(name, { name, type, inheritedType })
    );

    const assignedSlots = await this.deps.slotsDAO.getSlotMap();

    await ArrayUtils.parallelFor(
      [...desired.entries()],
      async ([propertyName, { type, inheritedType }]) =>
        assignedSlots.has(propertyName) ||
        this.deps.slotsDAO.assignSlot({ propertyName, propertyType: type, inheritedType })
    );

    await ArrayUtils.parallelFor(
      [...assignedSlots.keys()],
      async name => !desired.has(name) && this.deps.slotsDAO.unassignSlot(name)
    );

    await this.deps.slotsDAO.touchSentinel(snapshotVersion);
  }
}

export { SlotsReconciler };
