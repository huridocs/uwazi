import { Db } from 'mongodb';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { TenantWriteFence } from '../TenantWriteFence.js';
import { TenantWriteFenceUnavailable } from '../TenantWriteFenceUnavailable.js';
import { TenantNotQuiet } from '../TenantNotQuiet.js';
import { TenantWrittenDuringMigration } from '../TenantWrittenDuringMigration.js';

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

  describe('waitUntilQuiet', () => {
    const quiet = { quietMs: 200, timeoutMs: 2000 };
    // Node timers may fire a millisecond or two early compared to Date.now()
    const timerSlackMs = 5;

    it('should resolve once the quiet window passes with no writes', async () => {
      await fence.start();
      const startedAt = Date.now();

      await fence.waitUntilQuiet(quiet);

      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(quiet.quietMs - timerSlackMs);
    });

    it('should restart the window when a write arrives', async () => {
      await fence.start();
      const startedAt = Date.now();

      const waiting = fence.waitUntilQuiet(quiet);
      await new Promise(resolve => {
        setTimeout(resolve, 100);
      });
      await db.collection('entities').insertOne({ title: 'midway' });
      await waiting;

      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(100 + quiet.quietMs - timerSlackMs);
    });

    it('should reject with TenantNotQuiet listing the last writes when writes never stop', async () => {
      await fence.start();
      const writing = setInterval(() => {
        db.collection('entities')
          .insertOne({ title: 'busy' })
          .catch(() => {});
      }, 50);

      try {
        const waiting = fence.waitUntilQuiet({ quietMs: 200, timeoutMs: 600 });
        await expect(waiting).rejects.toBeInstanceOf(TenantNotQuiet);
        await expect(waiting).rejects.toThrow(/entities/);
      } finally {
        clearInterval(writing);
      }
    });

    it('should reject when the stream errors while waiting', async () => {
      const { emit } = stubWatch();
      const starting = fence.start();
      await waitForExpect(() => {
        expect(Db.prototype.watch).toHaveBeenCalled();
      });
      emit('resumeTokenChanged');
      await starting;

      const waiting = fence.waitUntilQuiet(quiet);
      emit('error', { message: 'connection lost' });

      await expect(waiting).rejects.toBeInstanceOf(TenantWriteFenceUnavailable);
    });

    it('should reject a pending wait when stopped', async () => {
      await fence.start();

      const waiting = expect(fence.waitUntilQuiet(quiet)).rejects.toBeInstanceOf(
        TenantWriteFenceUnavailable
      );
      await fence.stop();

      await waiting;
    });
  });

  describe('assertNoWrites', () => {
    const quiet = { quietMs: 200, timeoutMs: 2000 };

    it('should pass when nothing was written after the quiet point', async () => {
      await fence.start();
      await fence.waitUntilQuiet(quiet);

      expect(() => fence.assertNoWrites()).not.toThrow();
    });

    it('should throw naming the collections written after the quiet point', async () => {
      await fence.start();
      await fence.waitUntilQuiet(quiet);

      await db.collection('files').insertOne({ title: 'late' });
      await db.collection('files').insertOne({ title: 'later' });

      await waitForExpect(() => {
        expect(() => fence.assertNoWrites()).toThrow(TenantWrittenDuringMigration);
      });
      expect(() => fence.assertNoWrites()).toThrow(/files: 2/);
    });

    it('should throw when the stream errored after the quiet point', async () => {
      const { emit } = stubWatch();
      const starting = fence.start();
      await waitForExpect(() => {
        expect(Db.prototype.watch).toHaveBeenCalled();
      });
      emit('resumeTokenChanged');
      await starting;
      await fence.waitUntilQuiet(quiet);

      emit('error', { message: 'connection lost' });

      expect(() => fence.assertNoWrites()).toThrow(TenantWriteFenceUnavailable);
    });

    it('should throw when called before the tenant was quiet', async () => {
      await fence.start();

      expect(() => fence.assertNoWrites()).toThrow(/waitUntilQuiet/);
    });
  });
});
