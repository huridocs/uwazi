import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MongoConnectionsSyncHandler } from '../MongoConnectionsSyncHandler.js';
import { ConnectionsSyncHandlerFactory } from '../ConnectionsSyncHandlerFactory.js';
import { PostgresConnectionsSyncHandler } from '../PostgresConnectionsSyncHandler.js';

const connectionFixture = (overrides: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  entity: 'entity1',
  hub: new ObjectId(),
  template: null,
  ...overrides,
});

describe('MongoConnectionsSyncHandler', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({ connections: [] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('save', () => {
    it('should upsert the connection', async () => {
      const handler = new MongoConnectionsSyncHandler();
      const id = new ObjectId();
      const hub = new ObjectId();

      await handler.save({
        _id: id.toHexString(),
        entity: 'entity1',
        hub: hub.toHexString(),
        template: null,
      });

      const stored = await testingEnvironment.db.getAllFrom('connections');
      expect(stored).toMatchObject([{ _id: id, entity: 'entity1', hub, template: null }]);
    });

    it('should replace an existing connection on conflict by _id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        connections: [connectionFixture({ _id: id, entity: 'old' })],
      });

      const handler = new MongoConnectionsSyncHandler();
      await handler.save({
        _id: id.toHexString(),
        entity: 'new',
        hub: new ObjectId().toHexString(),
        template: null,
      });

      const stored = await testingEnvironment.db.getAllFrom('connections');
      expect(stored).toHaveLength(1);
      expect(stored[0].entity).toBe('new');
    });
  });

  describe('saveMultiple', () => {
    it('should upsert multiple connections', async () => {
      const handler = new MongoConnectionsSyncHandler();
      const id1 = new ObjectId().toHexString();
      const id2 = new ObjectId().toHexString();

      await handler.saveMultiple([
        { _id: id1, entity: 'e1', hub: new ObjectId().toHexString(), template: null },
        { _id: id2, entity: 'e2', hub: new ObjectId().toHexString(), template: null },
      ]);

      const stored = await testingEnvironment.db.getAllFrom('connections');
      expect(stored).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return the connection by id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        connections: [connectionFixture({ _id: id, entity: 'entity1' })],
      });

      const handler = new MongoConnectionsSyncHandler();
      const result = await handler.getById(id.toHexString());
      expect(result?.entity).toBe('entity1');
    });

    it('should return null when the connection does not exist', async () => {
      const handler = new MongoConnectionsSyncHandler();
      const result = await handler.getById(new ObjectId().toHexString());
      expect(result).toBeNull();
    });
  });

  describe('getHubConnections', () => {
    it('should return the connections of a hub', async () => {
      const hub = new ObjectId();
      await testingEnvironment.setUp({
        connections: [
          connectionFixture({ entity: 'entity1', hub }),
          connectionFixture({ entity: 'entity2', hub }),
          connectionFixture({ entity: 'entity3', hub: new ObjectId() }),
        ],
      });

      const handler = new MongoConnectionsSyncHandler();
      const result = await handler.getHubConnections(hub.toHexString());
      expect(result.map(connection => connection.entity).sort()).toEqual(['entity1', 'entity2']);
    });
  });

  describe('delete', () => {
    it('should delete the connection by id', async () => {
      const id = new ObjectId();
      await testingEnvironment.setUp({
        connections: [connectionFixture({ _id: id })],
      });

      const handler = new MongoConnectionsSyncHandler();
      await handler.delete(id.toHexString());

      const stored = await testingEnvironment.db.getAllFrom('connections');
      expect(stored).toHaveLength(0);
    });
  });

  describe('ConnectionsSyncHandlerFactory', () => {
    it('should return the mongo handler when the postgres flag is off', () => {
      expect(
        testingEnvironment.runWithContext(() => ConnectionsSyncHandlerFactory.default())
      ).toBeInstanceOf(MongoConnectionsSyncHandler);
    });

    it('should return the postgres handler when the postgres flag is on', () => {
      expect(
        testingEnvironment.runWithContext(() => ConnectionsSyncHandlerFactory.default(), {
          tenant: {
            ...testingTenants.current(),
            featureFlags: { postgresCore: true },
          },
        })
      ).toBeInstanceOf(PostgresConnectionsSyncHandler);
    });
  });
});
