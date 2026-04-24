/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';
import { OptimisticLockError } from '../../mongodb/common/OptimisticLockError.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

const createSut = (languageKeys: LanguageISO6391[] = ['en']) => {
  const transactionManager = TransactionManagerFactory.default();

  const sut = new MongoSlotsDAO({
    db: getConnection(),
    transactionManager,
    tenantName: 'tenant-a',
    settingsDS: TestUtils.mockClass<SettingsDataSource>({
      getInstalledLanguages: async () => languageKeys.map(key => ({ key, label: key })),
    }),
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

  describe('assignSlots()', () => {
    describe('translatable properties', () => {
      it('assigns slots for multiple translatable properties in one call', async () => {
        const { sut } = createSut(['en', 'pt']);

        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: null, language: null, rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
          { type: 'txt', slotName: 'txt_03', assignedTo: null, language: null, rand: 0.3 },
          { type: 'txt', slotName: 'txt_04', assignedTo: null, language: null, rand: 0.4 },
        ]);

        await sut.assignSlots([
          { propertyName: 'title', propertyType: 'text' },
          { propertyName: 'description', propertyType: 'text' },
        ]);

        const titleSlots = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        const descSlots = await slotsCollection().find({ assignedTo: 'description' }).toArray();

        expect(titleSlots).toHaveLength(2);
        expect(descSlots).toHaveLength(2);
        expect(titleSlots.map(s => s.language)).toEqual(expect.arrayContaining(['en', 'pt']));
        expect(descSlots.map(s => s.language)).toEqual(expect.arrayContaining(['en', 'pt']));
      });

      it('skips already-assigned (property, language) pairs', async () => {
        const { sut } = createSut(['en', 'pt']);

        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
        ]);

        await sut.assignSlots([{ propertyName: 'title', propertyType: 'text' }]);

        const titleSlots = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        expect(titleSlots).toHaveLength(2);
        // txt_01 stays assigned (no double-claim)
        expect(titleSlots.find(s => s.slotName === 'txt_01')?.language).toBe('en');
        expect(titleSlots.find(s => s.slotName === 'txt_02')?.language).toBe('pt');
      });

      it('adds a slot for a newly added language across all translatable properties', async () => {
        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
        ]);

        const { sut } = createSut(['en', 'pt']);
        await sut.assignSlots([{ propertyName: 'title', propertyType: 'text' }]);

        const titleSlots = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        expect(titleSlots).toHaveLength(2);
        expect(titleSlots.map(s => s.language)).toEqual(expect.arrayContaining(['en', 'pt']));
      });

      it('releases stale language slots when a language is removed', async () => {
        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: 'title', language: 'pt', rand: 0.2 },
        ]);

        const { sut } = createSut(['en']); // pt removed
        await sut.assignSlots([{ propertyName: 'title', propertyType: 'text' }]);

        const titleSlots = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        expect(titleSlots).toHaveLength(1);
        expect(titleSlots[0].language).toBe('en');

        const released = await slotsCollection().findOne({ slotName: 'txt_02' });
        expect(released?.assignedTo).toBeNull();
        expect(released?.language).toBeNull();
      });

      it('throws when there are not enough free slots for all properties', async () => {
        const { sut } = createSut(['en', 'pt']);

        // Only 3 free slots for 2 properties × 2 languages = 4 needed
        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: null, language: null, rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
          { type: 'txt', slotName: 'txt_03', assignedTo: null, language: null, rand: 0.3 },
        ]);

        await expect(
          sut.assignSlots([
            { propertyName: 'title', propertyType: 'text' },
            { propertyName: 'description', propertyType: 'text' },
          ])
        ).rejects.toThrow('No available slots for type txt');
      });
    });

    describe('non-translatable properties', () => {
      it('assigns slots for multiple non-translatable properties in one call', async () => {
        const { sut } = createSut();

        await slotsCollection().insertMany([
          { type: 'date', slotName: 'date_01', assignedTo: null, language: null, rand: 0.1 },
          { type: 'date', slotName: 'date_02', assignedTo: null, language: null, rand: 0.2 },
        ]);

        await sut.assignSlots([
          { propertyName: 'created_at', propertyType: 'date' },
          { propertyName: 'updated_at', propertyType: 'date' },
        ]);

        const assigned = await slotsCollection()
          .find({ assignedTo: { $in: ['created_at', 'updated_at'] } })
          .toArray();
        expect(assigned).toHaveLength(2);
        assigned.forEach(s => expect(s.language).toBeNull());
      });

      it('skips already-assigned non-translatable properties', async () => {
        const { sut } = createSut();

        await slotsCollection().insertMany([
          {
            type: 'date',
            slotName: 'date_01',
            assignedTo: 'created_at',
            language: null,
            rand: 0.1,
          },
          { type: 'date', slotName: 'date_02', assignedTo: null, language: null, rand: 0.2 },
        ]);

        await sut.assignSlots([{ propertyName: 'created_at', propertyType: 'date' }]);

        const slots = await slotsCollection().find({ assignedTo: 'created_at' }).toArray();
        expect(slots).toHaveLength(1);
        expect(slots[0].slotName).toBe('date_01');
      });

      it('throws when there are not enough free slots', async () => {
        const { sut } = createSut();

        await slotsCollection().insertOne({
          type: 'date',
          slotName: 'date_01',
          assignedTo: null,
          language: null,
          rand: 0.1,
        });

        await expect(
          sut.assignSlots([
            { propertyName: 'created_at', propertyType: 'date' },
            { propertyName: 'updated_at', propertyType: 'date' },
          ])
        ).rejects.toThrow('No available slots for type date');
      });
    });

    it('mixes translatable and non-translatable properties in one call', async () => {
      const { sut } = createSut(['en']);

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: null, language: null, rand: 0.1 },
        { type: 'date', slotName: 'date_01', assignedTo: null, language: null, rand: 0.2 },
      ]);

      await sut.assignSlots([
        { propertyName: 'title', propertyType: 'text' },
        { propertyName: 'created_at', propertyType: 'date' },
      ]);

      const txtSlot = await slotsCollection().findOne({ assignedTo: 'title' });
      const dateSlot = await slotsCollection().findOne({ assignedTo: 'created_at' });

      expect(txtSlot?.language).toBe('en');
      expect(dateSlot?.language).toBeNull();
    });

    it('is a no-op for properties with unsupported types', async () => {
      const { sut } = createSut();

      await expect(
        sut.assignSlots([{ propertyName: 'thumbnail', propertyType: 'image' }])
      ).resolves.not.toThrow();

      const assigned = await slotsCollection()
        .find({ assignedTo: { $ne: null } })
        .toArray();
      expect(assigned).toHaveLength(0);
    });

    it('is a no-op when the array is empty', async () => {
      const { sut } = createSut();
      await expect(sut.assignSlots([])).resolves.not.toThrow();
    });
  });

  describe('unassignSlots()', () => {
    it('releases all slots for multiple properties in one call', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
        { type: 'txt', slotName: 'txt_02', assignedTo: 'title', language: 'pt', rand: 0.2 },
        { type: 'date', slotName: 'date_01', assignedTo: 'created_at', language: null, rand: 0.3 },
        { type: 'txt', slotName: 'txt_03', assignedTo: 'other', language: 'en', rand: 0.4 },
      ]);

      await sut.unassignSlots(['title', 'created_at']);

      const releasedSlots = await slotsCollection()
        .find({ slotName: { $in: ['txt_01', 'txt_02', 'date_01'] } })
        .toArray();

      releasedSlots.forEach(s => {
        expect(s.assignedTo).toBeNull();
        expect(s.language).toBeNull();
        expect(typeof s.rand).toBe('number');
      });

      const untouched = await slotsCollection().findOne({ slotName: 'txt_03' });
      expect(untouched?.assignedTo).toBe('other');
    });

    it('is a no-op when the array is empty', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'txt',
        slotName: 'txt_01',
        assignedTo: 'title',
        language: 'en',
        rand: 0.1,
      });

      await expect(sut.unassignSlots([])).resolves.not.toThrow();

      const slot = await slotsCollection().findOne({ slotName: 'txt_01' });
      expect(slot?.assignedTo).toBe('title');
    });

    it('does not touch slots for properties not in the list', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
        { type: 'date', slotName: 'date_01', assignedTo: 'created_at', language: null, rand: 0.2 },
      ]);

      await sut.unassignSlots(['title']);

      const untouched = await slotsCollection().findOne({ slotName: 'date_01' });
      expect(untouched?.assignedTo).toBe('created_at');
    });
  });

  describe('getSlotMap()', () => {
    it('returns a composite propertyName::language key for translatable slots', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
        { type: 'txt', slotName: 'txt_02', assignedTo: 'title', language: 'pt', rand: 0.2 },
      ]);

      const slotMap = await sut.getSlotMap();

      expect(slotMap.get('title::en')?.slotName).toBe('txt_01');
      expect(slotMap.get('title::pt')?.slotName).toBe('txt_02');
      expect(slotMap.has('title')).toBe(false);
    });

    it('returns just the propertyName key for non-translatable slots', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'date', slotName: 'date_01', assignedTo: 'created_at', language: null, rand: 0.1 },
      ]);

      const slotMap = await sut.getSlotMap();

      expect(slotMap.get('created_at')?.slotName).toBe('date_01');
      expect(slotMap.has('created_at::null')).toBe(false);
    });

    it('returns both key forms when a mix of slot types is present', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
        { type: 'date', slotName: 'date_01', assignedTo: 'created_at', language: null, rand: 0.2 },
      ]);

      const slotMap = await sut.getSlotMap();

      expect(slotMap.get('title::en')?.slotName).toBe('txt_01');
      expect(slotMap.get('created_at')?.slotName).toBe('date_01');
      expect(slotMap.size).toBe(2);
    });

    it('excludes unassigned slots from the map', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
        { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.9 },
      ]);

      const slotMap = await sut.getSlotMap();

      expect(slotMap.size).toBe(1);
      expect(slotMap.has('title::en')).toBe(true);
    });
  });

  describe('slotKey()', () => {
    it('returns propertyName::language for translatable slots', () => {
      expect(MongoSlotsDAO.slotKey('title', 'en')).toBe('title::en');
      expect(MongoSlotsDAO.slotKey('my_select', 'pt')).toBe('my_select::pt');
    });

    it('returns just propertyName for non-translatable slots', () => {
      expect(MongoSlotsDAO.slotKey('created_at', null)).toBe('created_at');
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
