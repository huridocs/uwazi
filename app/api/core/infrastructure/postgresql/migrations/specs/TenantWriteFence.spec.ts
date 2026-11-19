import { Db } from 'mongodb';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { TenantWriteFence } from '../TenantWriteFence.js';
import { TenantWriteFenceUnavailable } from '../TenantWriteFenceUnavailable.js';

const TENANT_DB = 'tenant_write_fence_spec';
const OTHER_DB = 'tenant_write_fence_spec_other';

const stubWatch = () => {
  const listeners: Record<string, Function[]> = {};
  const register = (event: string, fn: Function) => {
    listeners[event] = [...(listeners[event] ?? []), fn];
  };
  const stream = { on: register, once: register, close: jest.fn() };
  //@ts-ignore
  jest.spyOn(Db.prototype, 'watch').mockReturnValue(stream);
  const emit = (event: string, payload?: object) =>
    (listeners[event] ?? []).forEach(fn => fn(payload));
  return { stream, emit };
};

describe('TenantWriteFence', () => {
  let db: Db;
  let otherDb: Db;
  let fence: TenantWriteFence;
  const epoch = new Date(0);

  beforeAll(async () => {
    await testingDB.connect();
    testingEnvironment.setRequestId();
    db = testingDB.db(TENANT_DB);
    otherDb = testingDB.db(OTHER_DB);
  });

  beforeEach(async () => {
    await db.collection('entities').deleteMany({});
    await db.collection('files').deleteMany({});
    await otherDb.collection('entities').deleteMany({});
    fence = new TenantWriteFence(db);
  });

  afterEach(async () => {
    await fence.stop();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await db.dropDatabase();
    await otherDb.dropDatabase();
    await testingEnvironment.tearDown();
  });

  it('should record inserts, updates and deletes made after start', async () => {
    await fence.start();

    const { insertedId: entityId } = await db.collection('entities').insertOne({ title: 'one' });
    await db.collection('entities').updateOne({ _id: entityId }, { $set: { title: 'uno' } });
    const { insertedId: fileId } = await db.collection('files').insertOne({});
    await db.collection('files').deleteOne({ _id: fileId });

    await waitForExpect(() => {
      expect(fence.writesSince(epoch)).toMatchObject([
        { collection: 'entities', operationType: 'insert' },
        { collection: 'entities', operationType: 'update' },
        { collection: 'files', operationType: 'insert' },
        { collection: 'files', operationType: 'delete' },
      ]);
    });
  });

  it('should only return writes received at or after the mark', async () => {
    await fence.start();
    await db.collection('entities').insertOne({ title: 'before' });
    await waitForExpect(() => {
      expect(fence.writesSince(epoch)).toHaveLength(1);
    });

    const mark = new Date(Date.now() + 1);
    await new Promise(resolve => {
      setTimeout(resolve, 5);
    });
    await db.collection('files').insertOne({ title: 'after' });

    await waitForExpect(() => {
      expect(fence.writesSince(mark)).toMatchObject([{ collection: 'files' }]);
    });
  });

  it('should not record writes made before start', async () => {
    await db.collection('entities').insertOne({ title: 'before' });
    await fence.start();

    await db.collection('files').insertOne({ title: 'after' });

    await waitForExpect(() => {
      expect(fence.writesSince(epoch)).toHaveLength(1);
    });
    expect(fence.writesSince(epoch)).toMatchObject([{ collection: 'files' }]);
  });

  it('should not record writes to another database', async () => {
    await fence.start();

    await otherDb.collection('entities').insertOne({ title: 'elsewhere' });
    await db.collection('files').insertOne({ title: 'sentinel' });

    await waitForExpect(() => {
      expect(fence.writesSince(epoch)).toHaveLength(1);
    });
    expect(fence.writesSince(epoch)).toMatchObject([{ collection: 'files' }]);
  });

  it('should allow stop before start and twice', async () => {
    await fence.stop();
    await fence.start();
    await fence.stop();
    await fence.stop();
  });

  it('should reject start when the stream errors before opening', async () => {
    const { emit } = stubWatch();
    const starting = fence.start();
    await waitForExpect(() => {
      expect(Db.prototype.watch).toHaveBeenCalled();
    });

    emit('error', {
      message: 'The $changeStream stage is only supported on replica sets',
      code: 40573,
    });

    await expect(starting).rejects.toBeInstanceOf(TenantWriteFenceUnavailable);
  });

  it('should throw a later stream error from writesSince', async () => {
    const { emit } = stubWatch();
    const starting = fence.start();
    await waitForExpect(() => {
      expect(Db.prototype.watch).toHaveBeenCalled();
    });
    emit('resumeTokenChanged');
    await starting;

    emit('error', { message: 'connection lost' });

    expect(() => fence.writesSince(epoch)).toThrow(TenantWriteFenceUnavailable);
    expect(() => fence.writesSince(epoch)).toThrow(/connection lost/);
  });
});
