import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDataSource, SlotDocument } from '../entities/MongoSlotsDataSource.js';
import {
  AmountPerSlotType,
  SlotBootstrapDefinitions,
} from '../entities/SlotBootstrapDefinitions.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';

const createSut = () => {
  const sut = new MongoSlotsBootstrapper({ database: getConnection() });

  return { sut };
};

const slotsCollection = () =>
  testingEnvironment.db.getCollection(MongoSlotsDataSource.collectionName)!;

const expectedSlots: Omit<SlotDocument, '_id'>[] = SlotBootstrapDefinitions.slotList().flatMap(
  slotType =>
    Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
      type: SlotBootstrapDefinitions.toPropertyType(slotType)!,
      slotName: SlotBootstrapDefinitions.createSlotName(slotType, index + 1),
      assignedTo: null,
    }))
);

const expectedSlotCount = expectedSlots.length;
const expectedSlotNames = expectedSlots.map(slot => slot.slotName).sort();

describe('MongoSlotsBootstrapper', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({ [MongoSlotsDataSource.collectionName]: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Slots creation', () => {
    it('creates startup slots in a fresh environment', async () => {
      const { sut } = createSut();

      await sut.executeAll();

      const slots = await slotsCollection().find({}).toArray();
      const slotNames = slots.map(slot => slot.slotName).sort();
      const normalizedSlots = slots.map(slot => ({
        type: slot.type,
        slotName: slot.slotName,
        assignedTo: slot.assignedTo,
      }));

      expect(slots).toHaveLength(expectedSlotCount);
      expect(slotNames).toEqual(expectedSlotNames);
      expect(normalizedSlots).toEqual(expect.arrayContaining(expectedSlots));
    });

    it('is idempotent when executed more than once in an old environment', async () => {
      const { sut } = createSut();

      await sut.executeAll();
      const firstCount = await slotsCollection().countDocuments();

      await expect(sut.executeAll()).resolves.not.toThrow();
      const secondCount = await slotsCollection().countDocuments();

      expect(secondCount).toBe(firstCount);
    });

    it('does not throw when another instance created the slots first', async () => {
      const { sut } = createSut();

      await slotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await slotsCollection().insertMany(expectedSlots);

      await expect(sut.executeAll()).resolves.not.toThrow();
      const slots = await slotsCollection().find({}).toArray();
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

      await sut.executeAll();

      const existingSlot = await slotsCollection().findOne({
        slotName: SlotBootstrapDefinitions.createSlotName('txt', 1),
      });

      expect(existingSlot?.assignedTo).toBe('existing_property');
    });
  });

  describe('Index creation', () => {
    it('creates slot indexes required for uniqueness constraints', async () => {
      const { sut } = createSut();

      await sut.executeAll();

      const indexes = await slotsCollection().indexes();
      const byName = Object.fromEntries(indexes.map(index => [index.name, index]));

      expect(byName.slotName_1?.unique).toBe(true);
      expect(byName.assignedTo_1?.unique).toBe(true);
      expect(byName.assignedTo_1?.partialFilterExpression).toEqual({
        assignedTo: { $type: 'string' },
      });
    });

    it('is idempotent when indexes already exist', async () => {
      const { sut } = createSut();

      await sut.executeAll();
      await expect(sut.executeAll()).resolves.not.toThrow();

      const indexes = await slotsCollection().indexes();
      const names = indexes.map(index => index.name);

      expect(names.filter(name => name === 'slotName_1')).toHaveLength(1);
      expect(names.filter(name => name === 'assignedTo_1')).toHaveLength(1);
    });

    it('does not throw when another instance created indexes first', async () => {
      const { sut } = createSut();

      await slotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await slotsCollection().createIndex(
        { assignedTo: 1 },
        { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
      );

      await expect(sut.executeAll()).resolves.not.toThrow();
    });
  });
});
