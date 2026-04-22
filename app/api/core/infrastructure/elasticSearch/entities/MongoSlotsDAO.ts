import { Db, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { OptimisticLockError } from '../../mongodb/common/OptimisticLockError.js';
import { SlotTypeRegistry } from './SlotTypeRegistry.js';
import type { SlotType } from './SlotType.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';

type SlotDocument = {
  _id: ObjectId;
  type: SlotType;
  slotName: string;
  assignedTo: string | null;
  language: LanguageISO6391 | null;
  rand: number;
};

type AssignedSlotDocument = SlotDocument & { assignedTo: string };

type AssignSlotInput = {
  propertyName: string;
  propertyType: PropertyType;
  inheritedType?: PropertyType;
};

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
  tenantName: string;
  settingsDS: SettingsDataSource;
};

type SlotMap = Map<string, AssignedSlotDocument>;

class MongoSlotsDAO extends MongoDataSource<SlotDocument> {
  static collectionName = 'elasticSlots';

  static sentinelId = 'reconcile_sentinel' as unknown as ObjectId;

  private static cache = new Map<string, SlotMap>();

  private readonly tenantName: string;

  private readonly settingsDS: SettingsDataSource;

  protected collectionName = MongoSlotsDAO.collectionName;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
    this.tenantName = deps.tenantName;
    this.settingsDS = deps.settingsDS;

    deps.transactionManager.onCommitted(async () => this.invalidateCache());
    deps.transactionManager.onRetry(async () => this.invalidateCache());
  }

  static clearCache() {
    MongoSlotsDAO.cache.clear();
  }

  invalidateCache() {
    MongoSlotsDAO.cache.delete(this.tenantName);
  }

  async assignSlot({ propertyName, propertyType, inheritedType }: AssignSlotInput): Promise<void> {
    const slotType = SlotTypeRegistry.toSlotType(propertyType, inheritedType);
    if (slotType === undefined) return;

    if (SlotTypeRegistry.isTranslatable(slotType)) {
      await this.reconcileTranslatableSlots(propertyName, slotType);
    } else {
      await this.assignNonTranslatableSlot(propertyName, slotType);
    }
  }

  private async reconcileTranslatableSlots(
    propertyName: string,
    slotType: SlotType
  ): Promise<void> {
    const installedLanguages = await this.settingsDS.getInstalledLanguages();
    const desired = new Set(installedLanguages.map(l => l.key));

    const current = await this.getCollection().find({ assignedTo: propertyName }).toArray();
    const assigned = new Set(
      current.map(s => s.language).filter((l): l is LanguageISO6391 => l !== null)
    );

    await this.assignMissingLanguageSlots(propertyName, slotType, desired, assigned);
    await this.releaseStaleLanguageSlots(propertyName, desired, assigned);
  }

  private async assignMissingLanguageSlots(
    propertyName: string,
    slotType: SlotType,
    desired: Set<LanguageISO6391>,
    assigned: Set<LanguageISO6391>
  ): Promise<void> {
    await ArrayUtils.parallelFor([...desired], async lang => {
      if (assigned.has(lang)) return;

      const updated = await this.getCollection().findOneAndUpdate(
        { assignedTo: null, type: slotType },
        { $set: { assignedTo: propertyName, language: lang } },
        { sort: { rand: 1 } }
      );

      if (!updated) throw new Error(`No available slots for type ${slotType}`);
    });
  }

  private async releaseStaleLanguageSlots(
    propertyName: string,
    desired: Set<LanguageISO6391>,
    assigned: Set<LanguageISO6391>
  ): Promise<void> {
    await ArrayUtils.parallelFor([...assigned], async lang => {
      if (desired.has(lang)) return;

      await this.getCollection().updateOne(
        { assignedTo: propertyName, language: lang },
        { $set: { assignedTo: null, language: null, rand: Math.random() } }
      );
    });
  }

  private async assignNonTranslatableSlot(propertyName: string, slotType: SlotType): Promise<void> {
    const already = await this.getCollection().findOne({ assignedTo: propertyName });
    if (already) return;

    const updated = await this.getCollection().findOneAndUpdate(
      { assignedTo: null, type: slotType },
      { $set: { assignedTo: propertyName, language: null } },
      { sort: { rand: 1 } }
    );

    if (!updated) throw new Error(`No available slots for type ${slotType}`);
  }

  async unassignSlot(propertyName: string): Promise<void> {
    await this.getCollection().updateMany({ assignedTo: propertyName }, [
      {
        $set: {
          assignedTo: null,
          language: null,
          rand: { $rand: {} },
        },
      },
    ]);
  }

  static slotKey(assignedTo: string, language: LanguageISO6391 | null): string {
    return language !== null ? `${assignedTo}::${language}` : assignedTo;
  }

  private async getAssignedSlots() {
    return this.getCollection()
      .find({ assignedTo: { $type: 'string' } })
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
    const slotMap: SlotMap = new Map(
      assignedSlots.map(slot => [MongoSlotsDAO.slotKey(slot.assignedTo, slot.language), slot])
    );

    MongoSlotsDAO.cache.set(this.tenantName, slotMap);

    return slotMap;
  }
}

export { MongoSlotsDAO };
export type { SlotDocument, SlotMap, AssignSlotInput };
