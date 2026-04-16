import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import {
  AmountPerSlotType,
  SlotBootstrapDefinitions,
} from '../entities/SlotBootstrapDefinitions.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';

const createSut = () => {
  const sut = new MongoSlotsBootstrapper({ database: getConnection() });

  return { sut };
};

const slotsCollection = () => testingEnvironment.db.getCollection(MongoSlotsDAO.collectionName)!;

const expectedSlots = SlotBootstrapDefinitions.slotList().flatMap(slotType =>
  Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
    type: slotType,
    slotName: SlotBootstrapDefinitions.createSlotName(slotType, index + 1),
    assignedTo: null,
  }))
);

const expectedSlotCount = expectedSlots.length;
const expectedSlotNames = expectedSlots.map(slot => slot.slotName).sort();

describe('MongoSlotsBootstrapper', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      [MongoSlotsDAO.collectionName]: [],
    });
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({ [MongoSlotsDAO.collectionName]: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Slots creation', () => {
    it('creates startup slots in a fresh environment', async () => {
      const { sut } = createSut();

      await sut.execute();

      const slots = await slotsCollection()
        .find({ _id: { $ne: MongoSlotsDAO.sentinelId as any } })
        .toArray();
      const slotNames = slots.map(slot => slot.slotName).sort();
      const normalizedSlots = slots.map(slot => ({
        type: slot.type,
        slotName: slot.slotName,
        assignedTo: slot.assignedTo,
      }));

      expect(slots).toHaveLength(expectedSlotCount);
      expect(slotNames).toEqual(expectedSlotNames);
      expect(normalizedSlots).toEqual(expect.arrayContaining(expectedSlots));
      slots.forEach(slot => expect(typeof slot.rand).toBe('number'));
    });

    it('is idempotent when executed more than once in an old environment', async () => {
      const { sut } = createSut();

      await sut.execute();
      const firstCount = await slotsCollection().countDocuments();

      await expect(sut.execute()).resolves.not.toThrow();
      const secondCount = await slotsCollection().countDocuments();

      expect(secondCount).toBe(firstCount);
    });

    it('does not throw when another instance created the slots first', async () => {
      const { sut } = createSut();

      await slotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await slotsCollection().insertMany(expectedSlots);

      await expect(sut.execute()).resolves.not.toThrow();
      const slots = await slotsCollection()
        .find({ _id: { $ne: MongoSlotsDAO.sentinelId as any } })
        .toArray();
      const slotNames = slots.map(slot => slot.slotName).sort();

      expect(slots).toHaveLength(expectedSlotCount);
      expect(slotNames).toEqual(expectedSlotNames);
    });

    it('does not overwrite assignedTo on existing slots', async () => {
      const { sut } = createSut();

      await slotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await slotsCollection().insertOne({
        type: 'text',
        slotName: SlotBootstrapDefinitions.createSlotName('txt', 1),
        assignedTo: 'existing_property',
      });

      await sut.execute();

      const existingSlot = await slotsCollection().findOne({
        slotName: SlotBootstrapDefinitions.createSlotName('txt', 1),
      });

      expect(existingSlot?.assignedTo).toBe('existing_property');
    });
  });

  describe('Index creation', () => {
    it('creates slot indexes required for uniqueness constraints', async () => {
      const { sut } = createSut();

      await sut.execute();

      const indexes = await slotsCollection().indexes();

      expect(indexes).toEqual([
        { v: 2, key: { _id: 1 }, name: '_id_' },
        { v: 2, key: { slotName: 1 }, name: 'slotName_1', unique: true },
        {
          v: 2,
          key: { assignedTo: 1 },
          name: 'assignedTo_1',
          unique: true,
          partialFilterExpression: { assignedTo: { $type: 'string' } },
        },
        {
          v: 2,
          key: { type: 1, rand: 1 },
          name: 'type_1_rand_1',
          partialFilterExpression: { assignedTo: null },
        },
      ]);
    });

    it('is idempotent when indexes already exist', async () => {
      const { sut } = createSut();

      await sut.execute();
      await expect(sut.execute()).resolves.not.toThrow();

      const indexes = await slotsCollection().indexes();

      expect(indexes).toEqual([
        { v: 2, key: { _id: 1 }, name: '_id_' },
        { v: 2, key: { slotName: 1 }, name: 'slotName_1', unique: true },
        {
          v: 2,
          key: { assignedTo: 1 },
          name: 'assignedTo_1',
          unique: true,
          partialFilterExpression: { assignedTo: { $type: 'string' } },
        },
        {
          v: 2,
          key: { type: 1, rand: 1 },
          name: 'type_1_rand_1',
          partialFilterExpression: { assignedTo: null },
        },
      ]);
    });

    it('does not throw when another instance created indexes first', async () => {
      const { sut } = createSut();

      await slotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await slotsCollection().createIndex(
        { assignedTo: 1 },
        { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
      );
      await slotsCollection().createIndex({ rand: 1 });

      await expect(sut.execute()).resolves.not.toThrow();
    });
  });

  describe('Sentinel creation', () => {
    it('creates the sentinel document on bootstrap', async () => {
      const { sut } = createSut();

      await sut.execute();

      const sentinel = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId as any });
      expect(sentinel).toBeDefined();
      expect(sentinel?.version).toBe(0);
    });

    it('does not overwrite an existing sentinel', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({ _id: MongoSlotsDAO.sentinelId as any, version: 42 });

      await sut.execute();

      const sentinel = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId as any });
      expect(sentinel?.version).toBe(42);
    });
  });
});
