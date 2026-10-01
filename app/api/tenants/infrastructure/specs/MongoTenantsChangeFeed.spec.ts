import { config } from '#api/config.js';
import { DB } from '#api/odm/DB.js';
import { Collection, Db } from 'mongodb';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { MongoTenantsChangeFeed } from '../MongoTenantsChangeFeed.js';

const feedTenantNames = ['feed-tenant-one', 'feed-tenant-two'];

describe('MongoTenantsChangeFeed', () => {
  let db: Db;
  let feed: MongoTenantsChangeFeed;

  beforeAll(async () => {
    await testingDB.connect();
    testingEnvironment.setRequestId();
    db = testingDB.db(config.SHARED_DB);
  });

  beforeEach(() => {
    feed = new MongoTenantsChangeFeed(() => DB.mongodb_Db(config.SHARED_DB));
  });

  afterEach(async () => {
    await feed.stop();
    await db.collection('tenants').deleteMany({ name: { $in: feedTenantNames } });
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should reject an empty name', async () => {
    await feed.start(() => {}, jest.fn());

    const insertEmpty = db.collection('tenants').insertOne({ name: '' });

    const validationFailed = 121;
    await expect(insertEmpty).rejects.toMatchObject({ code: validationFailed });
  });

  it('should require a unique name for tenants', async () => {
    await feed.start(() => {}, jest.fn());
    await db.collection('tenants').insertOne({ name: 'feed-tenant-one' });

    const insertDuplicate = db.collection('tenants').insertOne({ name: 'feed-tenant-one' });

    await expect(insertDuplicate).rejects.toMatchObject({ code: 11000 });
  });

  it('should call onChange when a tenant is inserted', async () => {
    const onChange = jest.fn();
    await feed.start(onChange, jest.fn());

    await db.collection('tenants').insertOne({ name: 'feed-tenant-two', dbName: 'feed_two' });

    await waitForExpect(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('with a stubbed stream', () => {
    const stubWatch = () => {
      const listeners: Record<string, Function[]> = {};
      const register = (event: string, fn: Function) => {
        listeners[event] = [...(listeners[event] ?? []), fn];
      };
      const stream = { on: register, once: register, close: jest.fn() };
      //@ts-ignore
      jest.spyOn(Collection.prototype, 'watch').mockReturnValue(stream);
      const emit = (event: string, payload?: object) =>
        (listeners[event] ?? []).forEach(fn => fn(payload));
      return { stream, emit, emitError: (error: object) => emit('error', error) };
    };

    it('should resolve start only once the stream is open', async () => {
      const { emit } = stubWatch();
      let started = false;

      const starting = feed
        .start(() => {}, jest.fn())
        .then(() => {
          started = true;
        });
      await waitForExpect(() => {
        expect(Collection.prototype.watch).toHaveBeenCalled();
      });
      await new Promise(resolve => {
        setImmediate(resolve);
      });
      expect(started).toBe(false);

      emit('resumeTokenChanged');
      await starting;
      expect(started).toBe(true);
    });

    it('should close the stream when watch is not supported', async () => {
      //Change streams are only supported on replica sets
      const { stream, emitError } = stubWatch();
      const starting = feed.start(() => {}, jest.fn());
      await waitForExpect(() => {
        expect(Collection.prototype.watch).toHaveBeenCalled();
      });

      emitError({
        message: 'The $changeStream stage is only supported on replica sets',
        code: 40573,
      });
      await starting;

      expect(stream.close).toHaveBeenCalled();
    });

    it('should pass any other stream error to onError', async () => {
      const { stream, emit, emitError } = stubWatch();
      const onError = jest.fn();
      const starting = feed.start(() => {}, onError);
      await waitForExpect(() => {
        expect(Collection.prototype.watch).toHaveBeenCalled();
      });
      emit('resumeTokenChanged');
      await starting;

      emitError({ message: 'something happened' });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'something happened' })
      );
      expect(stream.close).not.toHaveBeenCalled();
    });
  });
});
