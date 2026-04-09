import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';
import { OptimisticLockError } from '../../mongodb/common/OptimisticLockError.js';

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();

  const sut = new MongoSlotsDAO({
    db: getConnection(),
    transactionManager,
    tenantName: 'tenant-a',
  });

  return { sut, transactionManager };
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
        { type: 'txt', slotName: 'txt_01', assignedTo: null },
        { type: 'txt', slotName: 'txt_02', assignedTo: null },
      ]);

      await sut.assignSlot({ propertyName: 'title', propertyType: 'text' });

      const slots = await slotsCollection().find({}).toArray();

      expect(slots).toEqual([
        { _id: expect.any(ObjectId), type: 'txt', slotName: 'txt_01', assignedTo: 'title' },
        { _id: expect.any(ObjectId), type: 'txt', slotName: 'txt_02', assignedTo: null },
      ]);
    });

    it('throws when there are no available slots for the requested type', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'txt',
        slotName: 'txt_01',
        assignedTo: 'already_used',
      });

      await expect(sut.assignSlot({ propertyName: 'title', propertyType: 'text' })).rejects.toThrow(
        'No available slots for type txt'
      );
    });

    it('is a no-op when the property type is unsupported', async () => {
      const { sut } = createSut();

      await expect(
        sut.assignSlot({ propertyName: 'thumbnail', propertyType: 'image' })
      ).resolves.not.toThrow();

      const assigned = await slotsCollection()
        .find({ assignedTo: { $ne: null } })
        .toArray();
      expect(assigned).toHaveLength(0);
    });

    it('is a no-op when the property is already assigned to a slot', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title' },
        { type: 'txt', slotName: 'txt_02', assignedTo: null },
      ]);

      await expect(
        sut.assignSlot({ propertyName: 'title', propertyType: 'text' })
      ).resolves.not.toThrow();

      const slot = await slotsCollection().findOne({ slotName: 'txt_01' });
      expect(slot?.assignedTo).toBe('title');
    });
  });

  describe('unassignSlot()', () => {
    it('sets assignedTo to null for the matching property', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'txt',
        slotName: 'txt_01',
        assignedTo: 'title',
      });

      await sut.unassignSlot('title');

      const slot = await slotsCollection().findOne({ slotName: 'txt_01' });
      expect(slot?.assignedTo).toBeNull();
    });

    it('does not throw when property does not exist', async () => {
      const { sut } = createSut();
      await expect(sut.unassignSlot('missing_property')).resolves.not.toThrow();
    });
  });

  describe('getSlotMap()', () => {
    it('returns a propertyName -> slotName map', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title' },
        { type: 'date', slotName: 'date_01', assignedTo: 'createdAt' },
        { type: 'txt', slotName: 'txt_02', assignedTo: null },
      ]);

      const slotMap = await sut.getSlotMap();

      expect(slotMap.get('title')?.slotName).toBe('txt_01');
      expect(slotMap.get('createdAt')?.slotName).toBe('date_01');
      expect(slotMap.has('missing')).toBe(false);
    });
  });

  it('invalidates cache after transaction commits', async () => {
    const { sut, transactionManager } = createSut();

    const invalidateCacheSpy = jest.spyOn(sut, 'invalidateCache');

    expect(invalidateCacheSpy).toHaveBeenCalledTimes(0);

    await transactionManager.executeOnCommitHandlers(undefined);

    expect(invalidateCacheSpy).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache when the transaction is retried', async () => {
    const { sut, transactionManager } = createSut();

    const invalidateCacheSpy = jest.spyOn(sut, 'invalidateCache');

    expect(invalidateCacheSpy).toHaveBeenCalledTimes(0);

    await transactionManager.executeOnRetryHandlers();

    expect(invalidateCacheSpy).toHaveBeenCalledTimes(1);
  });

  describe('getSentinelVersion()', () => {
    it('returns the current sentinel version', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({ _id: MongoSlotsDAO.sentinelId, version: 3 });

      await expect(sut.getSentinelVersion()).resolves.toBe(3);
    });

    it('returns 0 when the sentinel does not exist', async () => {
      const { sut } = createSut();

      await expect(sut.getSentinelVersion()).resolves.toBe(0);
    });
  });

  describe('touchSentinel', () => {
    it('increments the sentinel version when expectedVersion matches', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({ _id: MongoSlotsDAO.sentinelId, version: 5 });

      await sut.touchSentinel(5);

      const sentinel = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId });
      expect(sentinel?.version).toBe(6);
    });

    it('throws OptimisticLockError when expectedVersion is stale', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({ _id: MongoSlotsDAO.sentinelId, version: 2 });

      await expect(sut.touchSentinel(1)).rejects.toThrow(OptimisticLockError);

      const sentinel = await slotsCollection().findOne({ _id: MongoSlotsDAO.sentinelId });

      expect(sentinel?.version).toBe(2);
    });
  });
});
