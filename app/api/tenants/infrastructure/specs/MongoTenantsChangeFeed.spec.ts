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

  describe('on error', () => {
    const stubWatch = () => {
      let errorEvent: Function = () => {};
      const stream = {
        on: (event: string, fn: Function) => {
          if (event === 'error') errorEvent = fn;
        },
        close: jest.fn(),
      };
      //@ts-ignore
      jest.spyOn(Collection.prototype, 'watch').mockReturnValue(stream);
      return { stream, emitError: (error: object) => errorEvent(error) };
    };

    it('should close the stream when watch is not supported', async () => {
      //Change streams are not supported by the Mongo in-memory server used by the tests
      const { stream, emitError } = stubWatch();
      await feed.start(() => {}, jest.fn());

      emitError({
        message: 'The $changeStream stage is only supported on replica sets',
        code: 40573,
      });

      expect(stream.close).toHaveBeenCalled();
    });

    it('should pass any other stream error to onError', async () => {
      const { stream, emitError } = stubWatch();
      const onError = jest.fn();
      await feed.start(() => {}, onError);

      emitError({ message: 'something happened' });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'something happened' })
      );
      expect(stream.close).not.toHaveBeenCalled();
    });
  });
});
