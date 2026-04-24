/* eslint-disable max-params */
/* eslint-disable max-statements */
import { Db, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { OptimisticLockError } from '../../mongodb/common/OptimisticLockError.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { SlotTypeRegistry } from './SlotTypeRegistry.js';
import type { SlotType } from './SlotType.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

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

type ResolvedInput = AssignSlotInput & { slotType: SlotType };

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

  async assignSlots(inputs: AssignSlotInput[]): Promise<void> {
    const resolved = inputs.flatMap(input => {
      const slotType = SlotTypeRegistry.toSlotType(input.propertyType, input.inheritedType);
      if (slotType === undefined) return [];
      return [{ ...input, slotType }];
    });
    if (resolved.length === 0) return;

    const translatableResolved = resolved.filter(r => SlotTypeRegistry.isTranslatable(r.slotType));
    const installedLanguages =
      translatableResolved.length > 0 ? await this.settingsDS.getInstalledLanguages() : [];
    const desiredLanguages = installedLanguages.map(l => l.key as LanguageISO6391);
    const desiredSet = new Set(desiredLanguages);

    const propertyNames = resolved.map(r => r.propertyName);
    const currentByProperty = await this.fetchCurrentAssignments(propertyNames);

    // Assign translatable slots — one find + one bulkWrite per slotType.
    // Grouping by slotType avoids the race where two properties see the same
    // free slots in parallel and silently under-assign.
    const translatableByType = MongoSlotsDAO.groupBySlotType(translatableResolved);
    await ArrayUtils.sequentialFor([...translatableByType], async ([slotType, props]) => {
      await this.assignMissingTranslatableSlots(
        slotType,
        props,
        desiredLanguages,
        desiredSet,
        currentByProperty
      );
    });

    // Assign non-translatable slots — one find + one bulkWrite per slotType.
    const nonTranslatableResolved = resolved.filter(
      r => !SlotTypeRegistry.isTranslatable(r.slotType)
    );
    const nonTranslatableByType = MongoSlotsDAO.groupBySlotType(nonTranslatableResolved);
    await ArrayUtils.sequentialFor([...nonTranslatableByType], async ([slotType, props]) => {
      await this.assignMissingNonTranslatableSlots(slotType, props, currentByProperty);
    });
  }

  private async fetchCurrentAssignments(
    propertyNames: string[]
  ): Promise<Map<string, Set<LanguageISO6391 | null>>> {
    const currentDocs = await this.getCollection()
      .find({ assignedTo: { $in: propertyNames } })
      .toArray();

    const currentByProperty = new Map<string, Set<LanguageISO6391 | null>>();
    currentDocs.forEach(doc => {
      const key = doc.assignedTo!;
      if (!currentByProperty.has(key)) currentByProperty.set(key, new Set());
      currentByProperty.get(key)!.add(doc.language);
    });
    return currentByProperty;
  }

  private static groupBySlotType<T extends { slotType: SlotType }>(items: T[]): Map<SlotType, T[]> {
    const grouped = new Map<SlotType, T[]>();
    items.forEach(item => {
      if (!grouped.has(item.slotType)) grouped.set(item.slotType, []);
      grouped.get(item.slotType)!.push(item);
    });
    return grouped;
  }

  private async assignMissingTranslatableSlots(
    slotType: SlotType,
    props: ResolvedInput[],
    desiredLanguages: LanguageISO6391[],
    desiredSet: Set<LanguageISO6391>,
    currentByProperty: Map<string, Set<LanguageISO6391 | null>>
  ): Promise<void> {
    const missing: Array<{ propertyName: string; language: LanguageISO6391 }> = [];
    props.forEach(({ propertyName }) => {
      const assigned = currentByProperty.get(propertyName) ?? new Set();
      desiredLanguages.forEach(lang => {
        if (!assigned.has(lang)) missing.push({ propertyName, language: lang });
      });
    });

    if (missing.length > 0) {
      const freeSlots = await this.getCollection()
        .find({ assignedTo: null, type: slotType })
        .sort({ rand: 1 })
        .limit(missing.length)
        .toArray();

      if (freeSlots.length < missing.length) {
        throw new Error(`No available slots for type ${slotType}`);
      }

      await this.getCollection().bulkWrite(
        missing.map(({ propertyName, language }, i) => ({
          updateOne: {
            filter: { _id: freeSlots[i]._id, assignedTo: null },
            update: { $set: { assignedTo: propertyName, language } },
          },
        }))
      );
    }

    const stale: Array<{ assignedTo: string; language: LanguageISO6391 }> = [];
    props.forEach(({ propertyName }) => {
      const assigned = currentByProperty.get(propertyName) ?? new Set();
      assigned.forEach(lang => {
        if (lang !== null && !desiredSet.has(lang)) {
          stale.push({ assignedTo: propertyName, language: lang });
        }
      });
    });

    if (stale.length > 0) {
      await this.getCollection().bulkWrite(
        stale.map(({ assignedTo, language }) => ({
          updateOne: {
            filter: { assignedTo, language },
            update: [{ $set: { assignedTo: null, language: null, rand: { $rand: {} } } }],
          },
        }))
      );
    }
  }

  private async assignMissingNonTranslatableSlots(
    slotType: SlotType,
    props: ResolvedInput[],
    currentByProperty: Map<string, Set<LanguageISO6391 | null>>
  ): Promise<void> {
    const unassigned = props.filter(({ propertyName }) => !currentByProperty.has(propertyName));
    if (unassigned.length === 0) return;

    const freeSlots = await this.getCollection()
      .find({ assignedTo: null, type: slotType })
      .sort({ rand: 1 })
      .limit(unassigned.length)
      .toArray();

    if (freeSlots.length < unassigned.length) {
      throw new Error(`No available slots for type ${slotType}`);
    }

    await this.getCollection().bulkWrite(
      unassigned.map(({ propertyName }, i) => ({
        updateOne: {
          filter: { _id: freeSlots[i]._id, assignedTo: null },
          update: { $set: { assignedTo: propertyName, language: null } },
        },
      }))
    );
  }

  async unassignSlots(propertyNames: string[]): Promise<void> {
    if (propertyNames.length === 0) return;
    await this.getCollection().updateMany({ assignedTo: { $in: propertyNames } }, [
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
