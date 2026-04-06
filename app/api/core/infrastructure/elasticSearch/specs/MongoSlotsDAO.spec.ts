import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDAO } from '../entities/MongoSlotsDAO.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';

const createSut = () => {
  const sut = new MongoSlotsDAO(getConnection(), TransactionManagerFactory.default());

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

    it('throws when property is already assigned (duplicate key)', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: 'title' },
        { type: 'text', slotName: 'text_02', assignedTo: null },
      ]);

      await expect(sut.assignSlot({ propertyName: 'title', type: 'text' })).rejects.toThrow(
        'Property "title" is already assigned to a slot'
      );
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

  describe('updatePropertyName()', () => {
    it('renames an existing slot', async () => {
      const { sut } = createSut();

      await slotsCollection().insertOne({
        type: 'text',
        slotName: 'text_01',
        assignedTo: 'title',
      });

      await sut.updatePropertyName({ oldName: 'title', newName: 'title_changed' });

      const updated = await slotsCollection().findOne({ slotName: 'text_01' });

      expect(updated).toEqual({
        _id: expect.any(ObjectId),
        type: 'text',
        slotName: 'text_01',
        assignedTo: 'title_changed',
      });
    });

    it('throws when old slot name does not exist', async () => {
      const { sut } = createSut();

      await expect(
        sut.updatePropertyName({ oldName: 'not_existing', newName: 'not_existing_changed' })
      ).rejects.toThrow('No slot found with property name not_existing');
    });

    it('propagates duplicate key errors when target slot name already exists', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: 'title' },
        { type: 'text', slotName: 'text_02', assignedTo: 'title_changed' },
      ]);

      await expect(
        sut.updatePropertyName({ oldName: 'title', newName: 'title_changed' })
      ).rejects.toThrow();
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

      const slotMap = await sut.getSlotMap('tenant-a');

      expect(slotMap.get('title')).toBe('txt_01');
      expect(slotMap.get('createdAt')).toBe('date_01');
      expect(slotMap.has('missing')).toBe(false);
    });

    it('uses module-level cache on the second call for the same tenant', async () => {
      const { sut } = createSut();
      const getAssignedSlotsSpy = jest.spyOn(sut, 'getAssignedSlots');

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'txt_01', assignedTo: 'title' },
        { type: 'date', slotName: 'date_01', assignedTo: 'createdAt' },
      ]);

      await sut.getSlotMap('tenant-a');
      await sut.getSlotMap('tenant-a');

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

      await sut.getSlotMap('tenant-a');
      await sut.assignSlot({ propertyName: 'summary', type: 'text', tenantId: 'tenant-a' });
      await sut.getSlotMap('tenant-a');

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

      await sut.getSlotMap('tenant-a');
      await sut.unassignSlot('title', 'tenant-a');
      const slotMap = await sut.getSlotMap('tenant-a');

      expect(getAssignedSlotsSpy).toHaveBeenCalledTimes(2);
      expect(slotMap.has('title')).toBe(false);
    });

    it('invalidates cache after updatePropertyName()', async () => {
      const { sut } = createSut();
      const getAssignedSlotsSpy = jest.spyOn(sut, 'getAssignedSlots');

      await slotsCollection().insertOne({
        type: 'text',
        slotName: 'txt_01',
        assignedTo: 'title',
      });

      await sut.getSlotMap('tenant-a');
      await sut.updatePropertyName({
        oldName: 'title',
        newName: 'title_changed',
        tenantId: 'tenant-a',
      });
      const slotMap = await sut.getSlotMap('tenant-a');

      expect(getAssignedSlotsSpy).toHaveBeenCalledTimes(2);
      expect(slotMap.get('title_changed')).toBe('txt_01');
      expect(slotMap.has('title')).toBe(false);
    });
  });
});
