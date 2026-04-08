import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';

const createSut = () => {
  const sut = new MongoSlotsDAO({
    db: getConnection(),
    transactionManager: TransactionManagerFactory.default(),
    tenantName: 'tenant-a',
  });

  return { sut };
};

const slotsCollection = () => testingEnvironment.db.getCollection(MongoSlotsDAO.collectionName)!;

describe('MongoSlotsDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});

    const bootstrapper = new MongoSlotsBootstrapper({ database: getConnection() });
    await bootstrapper.createIndexes();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({ [MongoSlotsDAO.collectionName]: [] });
    MongoSlotsDAO.clearCache();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('assignSlot()', () => {
    it('assigns an available slot for the requested property type', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: null },
        { type: 'text', slotName: 'text_02', assignedTo: null },
      ]);

      await sut.assignSlot({ propertyName: 'title', type: 'text' });

      const slots = await slotsCollection().find({}).toArray();

      expect(slots).toEqual([
        { _id: expect.any(ObjectId), type: 'text', slotName: 'text_01', assignedTo: 'title' },
        { _id: expect.any(ObjectId), type: 'text', slotName: 'text_02', assignedTo: null },
      ]);
    });

    it('throws when there are no available slots for the requested type', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'text',
        slotName: 'text_01',
        assignedTo: 'already_used',
      });

      await expect(sut.assignSlot({ propertyName: 'title', type: 'text' })).rejects.toThrow(
        'No available slots for type text'
      );
    });

    it('throws when there are no available slots for a different type', async () => {
      const { sut } = createSut();

      await expect(sut.assignSlot({ propertyName: 'thumbnail', type: 'image' })).rejects.toThrow(
        'No available slots for type image'
      );
    });

    it('is a no-op when the property is already assigned to a slot', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: 'title' },
        { type: 'text', slotName: 'text_02', assignedTo: null },
      ]);

      await expect(sut.assignSlot({ propertyName: 'title', type: 'text' })).resolves.not.toThrow();

      // Slot assignment is unchanged
      const slot = await slotsCollection().findOne({ slotName: 'text_01' });
      expect(slot?.assignedTo).toBe('title');
    });
  });

  describe('unassignSlot()', () => {
    it('sets assignedTo to null for the matching property', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'text',
        slotName: 'text_01',
        assignedTo: 'title',
      });

      await sut.unassignSlot('title');

      const slot = await slotsCollection().findOne({ slotName: 'text_01' });
      expect(slot?.assignedTo).toBeNull();
    });

    it('does not throw when property does not exist', async () => {
      const { sut } = createSut();
      await expect(sut.unassignSlot('missing_property')).resolves.not.toThrow();
    });
  });

  describe('getAssignedSlots()', () => {
    it('returns only slots with assignedTo different from null', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: 'title' },
        { type: 'text', slotName: 'text_02', assignedTo: null },
        { type: 'date', slotName: 'date_01', assignedTo: 'createdAt' },
      ]);

      const slots = await sut.getAssignedSlots();
      const slotNames = slots.map(slot => slot.slotName).sort();

      expect(slots).toHaveLength(2);
      expect(slotNames).toEqual(['date_01', 'text_01']);
    });

    it('returns an empty array when no slot is assigned', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: null },
        { type: 'date', slotName: 'date_01', assignedTo: null },
      ]);

      await expect(sut.getAssignedSlots()).resolves.toEqual([]);
    });
  });

  describe('getSlotMap()', () => {
    it('returns a propertyName -> slotName map', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'txt_01', assignedTo: 'title' },
        { type: 'date', slotName: 'date_01', assignedTo: 'createdAt' },
        { type: 'text', slotName: 'txt_02', assignedTo: null },
      ]);

      const slotMap = await sut.getSlotMap();

      expect(slotMap.get('title')?.slotName).toBe('txt_01');
      expect(slotMap.get('createdAt')?.slotName).toBe('date_01');
      expect(slotMap.has('missing')).toBe(false);
    });

    it('uses module-level cache on the second call for the same tenant', async () => {
      const { sut } = createSut();
      const getAssignedSlotsSpy = jest.spyOn(sut, 'getAssignedSlots');

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'txt_01', assignedTo: 'title' },
        { type: 'date', slotName: 'date_01', assignedTo: 'createdAt' },
      ]);

      await sut.getSlotMap();
      await sut.getSlotMap();

      expect(getAssignedSlotsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache invalidation on mutations', () => {
    it('invalidates cache after assignSlot()', async () => {
      const { sut } = createSut();
      const getAssignedSlotsSpy = jest.spyOn(sut, 'getAssignedSlots');

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'txt_01', assignedTo: 'title' },
        { type: 'text', slotName: 'txt_02', assignedTo: null },
      ]);

      await sut.getSlotMap();
      await sut.assignSlot({ propertyName: 'summary', type: 'text' });
      await sut.getSlotMap();

      expect(getAssignedSlotsSpy).toHaveBeenCalledTimes(2);
    });

    it('invalidates cache after unassignSlot()', async () => {
      const { sut } = createSut();
      const getAssignedSlotsSpy = jest.spyOn(sut, 'getAssignedSlots');

      await slotsCollection().insertOne({
        type: 'text',
        slotName: 'txt_01',
        assignedTo: 'title',
      });

      await sut.getSlotMap();
      await sut.unassignSlot('title');
      const slotMap = await sut.getSlotMap();

      expect(getAssignedSlotsSpy).toHaveBeenCalledTimes(2);
      expect(slotMap.has('title')).toBe(false);
    });
  });

  describe('touchSentinel()', () => {
    it('increments the sentinel version', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({ _id: MongoSlotsDAO.sentinelId as any, version: 0 });

      await sut.touchSentinel();

      const sentinel = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId as any });
      expect(sentinel?.version).toBe(1);
    });

    it('creates the sentinel if it does not exist (upsert)', async () => {
      const { sut } = createSut();

      await sut.touchSentinel();

      const sentinel = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId as any });
      expect(sentinel).toBeDefined();
      expect(sentinel?.version).toBe(1);
    });
  });
});
