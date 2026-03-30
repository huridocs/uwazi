import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoSlotsDataSource } from '../entities/MongoSlotsDataSource.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { MongoSlotsBootstrapper } from '../entities/MongoSlotsBootstrapper.js';

const createSut = () => {
  const sut = new MongoSlotsDataSource(getConnection(), TransactionManagerFactory.default());

  return { sut };
};

const slotsCollection = () =>
  testingEnvironment.db.getCollection(MongoSlotsDataSource.collectionName)!;

describe('MongoSlotsDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});

    const bootstrapper = new MongoSlotsBootstrapper({ database: getConnection() });
    await bootstrapper.createIndexes();
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({ [MongoSlotsDataSource.collectionName]: [] });
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

      await sut.updatePropertyName({ oldName: 'text_01', newName: 'text_03' });

      const updated = await slotsCollection().findOne({ slotName: 'text_03' });
      const old = await slotsCollection().findOne({ slotName: 'text_01' });

      expect(updated).toEqual(
        expect.objectContaining({
          type: 'text',
          assignedTo: 'title',
        })
      );
      expect(old).toBeNull();
    });

    it('throws when old slot name does not exist', async () => {
      const { sut } = createSut();

      await expect(
        sut.updatePropertyName({ oldName: 'text_99', newName: 'text_01' })
      ).rejects.toThrow('No slot found with property name text_99');
    });

    it('propagates duplicate key errors when target slot name already exists', async () => {
      const { sut } = createSut();

      await slotsCollection().insertMany([
        { type: 'text', slotName: 'text_01', assignedTo: null },
        { type: 'text', slotName: 'text_02', assignedTo: null },
      ]);

      await expect(
        sut.updatePropertyName({ oldName: 'text_01', newName: 'text_02' })
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
});
