import { MongoSlotsDAO } from './MongoSlotsDAO.js';
import { MongoTemplatesDAO } from '../../mongodb/template/MongoTemplatesDAO.js';

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

    await this.deps.slotsDAO.assignSlots(
      allProperties.map(({ type, inheritedType, name }) => ({
        propertyName: name,
        propertyType: type,
        inheritedType,
      }))
    );

    const staleNames = [...assignedPropertyNames].filter(
      name => !allProperties.some(p => p.name === name)
    );
    await this.deps.slotsDAO.unassignSlots(staleNames);

    await this.deps.slotsDAO.touchSentinel(snapshotVersion);
  }
}

export { SlotsReconciler };
