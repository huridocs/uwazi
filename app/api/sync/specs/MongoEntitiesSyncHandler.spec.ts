import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoEntitiesSyncHandler } from '#api/sync/MongoEntitiesSyncHandler.js';

const factory = () => new MongoEntitiesSyncHandler();

const entityFixture = (overrides: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  sharedId: 'sharedId',
  language: 'en',
  template: new ObjectId(),
  title: 'Synced entity',
  icon: { _id: null, type: 'entity' },
  metadata: {},
  user: new ObjectId(),
  published: true,
  creationDate: 100,
  editDate: 200,
  permissions: [],
  ...overrides,
});

describe('MongoEntitiesSyncHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({ entities: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('save', () => {
    it('should upsert the entity', async () => {
      const handler = factory();
      const id = new ObjectId();
      await handler.save({
        _id: id.toHexString(),
        sharedId: 'sharedId',
        language: 'en',
        template: new ObjectId().toHexString(),
        title: 'Synced entity',
        metadata: {},
        published: true,
        creationDate: 100,
        editDate: 200,
      } as any);

      const stored = await testingEnvironment.db.getAllFrom('entities');
      expect(stored).toMatchObject([{ _id: id, title: 'Synced entity', sharedId: 'sharedId' }]);
    });

    it('should replace an existing entity on conflict by _id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        entities: [entityFixture({ _id: id, title: 'Old title' })],
      });

      const handler = factory();
      await handler.save({
        ...entityFixture({ _id: id, title: 'New title' }),
        _id: id.toHexString(),
      } as any);

      const stored = await testingEnvironment.db.getAllFrom('entities');
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe('New title');
    });
  });

  describe('saveMultiple', () => {
    it('should upsert multiple entities', async () => {
      const handler = factory();
      const id1 = new ObjectId().toHexString();
      const id2 = new ObjectId().toHexString();
      await handler.saveMultiple([
        {
          _id: id1,
          sharedId: 's1',
          language: 'en',
          template: new ObjectId().toHexString(),
          title: 'E1',
          metadata: {},
          published: true,
          creationDate: 1,
          editDate: 2,
        } as any,
        {
          _id: id2,
          sharedId: 's2',
          language: 'en',
          template: new ObjectId().toHexString(),
          title: 'E2',
          metadata: {},
          published: true,
          creationDate: 1,
          editDate: 2,
        } as any,
      ]);

      const stored = await testingEnvironment.db.getAllFrom('entities');
      expect(stored).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return the entity by id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        entities: [entityFixture({ _id: id, title: 'Entity' })],
      });

      const handler = factory();
      const result = await handler.getById(id.toHexString());
      expect(result?.title).toBe('Entity');
    });

    it('should return null when the entity does not exist', async () => {
      const handler = factory();
      const result = await handler.getById(new ObjectId().toHexString());
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete the entity by id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        entities: [entityFixture({ _id: id })],
      });

      const handler = factory();
      await handler.delete(id.toHexString());

      const stored = await testingEnvironment.db.getAllFrom('entities');
      expect(stored).toHaveLength(0);
    });
  });
});
