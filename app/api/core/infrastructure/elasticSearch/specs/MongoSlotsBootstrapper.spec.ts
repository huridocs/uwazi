import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDataSource, SlotDocument } from '../entities/MongoSlotsDataSource.js';
import { AmountPerSlotType, SlotsMapper } from '../entities/SlotDefinition.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';

const createSut = () => {
  const sut = new MongoSlotsBootstrapper({ database: getConnection() });

  return { sut };
};

const { collectionName } = MongoSlotsDataSource;

const dropSlotsCollection = async () => {
  await getConnection()
    .collection(collectionName)
    .drop()
    .catch(() => {
      /* collection does not exist yet */
    });
};

const getSlotsCollection = () => getConnection().collection(collectionName);

const expectedSlots: Omit<SlotDocument, '_id'>[] = SlotsMapper.slotList().flatMap(slotType =>
  Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
    type: SlotsMapper.toPropertyType(slotType)!,
    slotName: SlotsMapper.createSlotName(slotType, index + 1),
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
    await dropSlotsCollection();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Slots creation', () => {
    it('creates startup slots in a fresh environment', async () => {
      const { sut } = createSut();

      await sut.execute();

      const slots = await getSlotsCollection().find({}).toArray();
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

      await sut.execute();
      const firstCount = await getSlotsCollection().countDocuments();

      await expect(sut.execute()).resolves.not.toThrow();
      const secondCount = await getSlotsCollection().countDocuments();

      expect(secondCount).toBe(firstCount);
    });

    it('does not throw when another instance created the slots first', async () => {
      const { sut } = createSut();

      await getSlotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await getSlotsCollection().insertMany(expectedSlots);

      await expect(sut.execute()).resolves.not.toThrow();
      const slots = await getSlotsCollection().find({}).toArray();
      const slotNames = slots.map(slot => slot.slotName).sort();

      expect(slots).toHaveLength(expectedSlotCount);
      expect(slotNames).toEqual(expectedSlotNames);
    });

    it('does not overwrite assignedTo on existing slots', async () => {
      const { sut } = createSut();

      await getSlotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await getSlotsCollection().insertOne({
        type: 'text',
        slotName: SlotsMapper.createSlotName('txt', 1),
        assignedTo: 'existing_property',
      });

      await sut.execute();

      const existingSlot = await getSlotsCollection().findOne({
        slotName: SlotsMapper.createSlotName('txt', 1),
      });

      expect(existingSlot?.assignedTo).toBe('existing_property');
    });
  });

  describe('Index creation', () => {
    it('creates slot indexes required for uniqueness constraints', async () => {
      const { sut } = createSut();

      await sut.execute();

      const indexes = await getSlotsCollection().indexes();
      const byName = Object.fromEntries(indexes.map(index => [index.name, index]));

      expect(byName.slotName_1?.unique).toBe(true);
      expect(byName.assignedTo_1?.unique).toBe(true);
      expect(byName.assignedTo_1?.partialFilterExpression).toEqual({
        assignedTo: { $type: 'string' },
      });
    });

    it('is idempotent when indexes already exist', async () => {
      const { sut } = createSut();

      await sut.execute();
      await expect(sut.execute()).resolves.not.toThrow();

      const indexes = await getSlotsCollection().indexes();
      const names = indexes.map(index => index.name);

      expect(names.filter(name => name === 'slotName_1')).toHaveLength(1);
      expect(names.filter(name => name === 'assignedTo_1')).toHaveLength(1);
    });

    it('does not throw when another instance created indexes first', async () => {
      const { sut } = createSut();

      await getSlotsCollection().createIndex({ slotName: 1 }, { unique: true });
      await getSlotsCollection().createIndex(
        { assignedTo: 1 },
        { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } }
      );

      await expect(sut.execute()).resolves.not.toThrow();
    });
  });
});
