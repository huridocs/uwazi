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

  describe('assignSlot()', () => {
    describe('translatable property type (txt)', () => {
      it('assigns one slot per installed language', async () => {
        const { sut } = createSut(['en', 'pt']);

        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: null, language: null, rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
          { type: 'txt', slotName: 'txt_03', assignedTo: null, language: null, rand: 0.9 },
        ]);

        await sut.assignSlot({ propertyName: 'title', propertyType: 'text' });

        const assigned = await slotsCollection()
          .find({ assignedTo: 'title' })
          .sort({ rand: 1 })
          .toArray();

        expect(assigned).toHaveLength(2);
        expect(assigned.map(s => s.language)).toEqual(expect.arrayContaining(['en', 'pt']));
      });

      it('is a no-op for already-assigned (property, language) pairs', async () => {
        const { sut } = createSut(['en']);

        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
        ]);

        await sut.assignSlot({ propertyName: 'title', propertyType: 'text' });

        const assigned = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        expect(assigned).toHaveLength(1);
        expect(assigned[0].slotName).toBe('txt_01');
      });

      it('adds a slot for a newly added language on re-call', async () => {
        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: null, language: null, rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: null, language: null, rand: 0.2 },
        ]);

        const { sut: sutEn } = createSut(['en']);
        await sutEn.assignSlot({ propertyName: 'title', propertyType: 'text' });

        const { sut: sutEnPt } = createSut(['en', 'pt']);
        await sutEnPt.assignSlot({ propertyName: 'title', propertyType: 'text' });

        const assigned = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        expect(assigned).toHaveLength(2);
        expect(assigned.map(s => s.language)).toEqual(expect.arrayContaining(['en', 'pt']));
      });

      it('releases a slot for a removed language on re-call', async () => {
        await slotsCollection().insertMany([
          { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
          { type: 'txt', slotName: 'txt_02', assignedTo: 'title', language: 'pt', rand: 0.2 },
        ]);

        const { sut } = createSut(['en']); // pt removed
        await sut.assignSlot({ propertyName: 'title', propertyType: 'text' });

        const assigned = await slotsCollection().find({ assignedTo: 'title' }).toArray();
        expect(assigned).toHaveLength(1);
        expect(assigned[0].language).toBe('en');

        const released = await slotsCollection().findOne({ slotName: 'txt_02' });
        expect(released?.assignedTo).toBeNull();
        expect(released?.language).toBeNull();
      });

      it('throws when no available slot for a needed language', async () => {
        const { sut } = createSut(['en', 'pt']);

        await slotsCollection().insertOne({
          type: 'txt',
          slotName: 'txt_01',
          assignedTo: null,
          language: null,
          rand: 0.1,
        });

        await expect(
          sut.assignSlot({ propertyName: 'title', propertyType: 'text' })
        ).rejects.toThrow('No available slots for type txt');
      });
    });

    describe('non-translatable property type (date)', () => {
      it('assigns one slot with language: null', async () => {
        const { sut } = createSut(['en', 'pt']);

        await slotsCollection().insertMany([
          { type: 'date', slotName: 'date_01', assignedTo: null, language: null, rand: 0.1 },
          { type: 'date', slotName: 'date_02', assignedTo: null, language: null, rand: 0.9 },
        ]);

        await sut.assignSlot({ propertyName: 'created_at', propertyType: 'date' });

        const assigned = await slotsCollection().find({ assignedTo: 'created_at' }).toArray();
        expect(assigned).toHaveLength(1);
        expect(assigned[0].language).toBeNull();
      });

      it('is a no-op when already assigned', async () => {
        const { sut } = createSut();

        await slotsCollection().insertMany([
          {
            type: 'date',
            slotName: 'date_01',
            assignedTo: 'created_at',
            language: null,
            rand: 0.1,
          },
          { type: 'date', slotName: 'date_02', assignedTo: null, language: null, rand: 0.9 },
        ]);

        await sut.assignSlot({ propertyName: 'created_at', propertyType: 'date' });

        const assigned = await slotsCollection().find({ assignedTo: 'created_at' }).toArray();
        expect(assigned).toHaveLength(1);
        expect(assigned[0].slotName).toBe('date_01');
      });

      it('throws when no available slot', async () => {
        const { sut } = createSut();

        await slotsCollection().insertOne({
          type: 'date',
          slotName: 'date_01',
          assignedTo: 'other_prop',
          language: null,
          rand: 0.1,
        });

        await expect(
          sut.assignSlot({ propertyName: 'created_at', propertyType: 'date' })
        ).rejects.toThrow('No available slots for type date');
      });
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
  });

  describe('unassignSlot()', () => {
    it('releases all language variant slots for a translatable property', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'txt', slotName: 'txt_01', assignedTo: 'title', language: 'en', rand: 0.1 },
        { type: 'txt', slotName: 'txt_02', assignedTo: 'title', language: 'pt', rand: 0.2 },
        { type: 'txt', slotName: 'txt_03', assignedTo: 'other', language: 'en', rand: 0.3 },
      ]);

      await sut.unassignSlot('title');

      const titleSlots = await slotsCollection()
        .find({ slotName: { $in: ['txt_01', 'txt_02'] } })
        .toArray();
      titleSlots.forEach(s => {
        expect(s.assignedTo).toBeNull();
        expect(s.language).toBeNull();
        expect(typeof s.rand).toBe('number');
      });

      const otherSlot = await slotsCollection().findOne({ slotName: 'txt_03' });
      expect(otherSlot?.assignedTo).toBe('other');
    });

    it('releases the single slot for a non-translatable property', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'date',
        slotName: 'date_01',
        assignedTo: 'created_at',
        language: null,
        rand: 0.1,
      });

      await sut.unassignSlot('created_at');

      const slot = await slotsCollection().findOne({ slotName: 'date_01' });
      expect(slot?.assignedTo).toBeNull();
      expect(slot?.language).toBeNull();
      expect(typeof slot?.rand).toBe('number');
    });

    it('does not throw when property does not exist', async () => {
      const { sut } = createSut();
      await expect(sut.unassignSlot('missing_property')).resolves.not.toThrow();
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
