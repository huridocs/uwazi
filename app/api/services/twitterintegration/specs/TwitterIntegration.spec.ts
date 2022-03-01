import { DB } from 'api/odm';
import { fixturer, createNewMongoDB } from 'api/utils/testing_db';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TwitterIntegration } from 'api/services/twitterintegration/TwitterIntegration';
import { Db } from 'mongodb';
import {
  fixturesOneTenant,
  fixturesOtherTenant,
  fixturesTenantWithoutTwitter,
} from 'api/services/twitterintegration/specs/fixtures';
import { tenants } from 'api/tenants';
import request from 'shared/JSONRequest';
import EntitiesModel from 'api/entities/entitiesModel';

jest.mock('api/services/tasksmanager/TaskManager.ts');

describe('TwitterIntegration', () => {
  let twitterIntegration: TwitterIntegration;

  const folders = {
    uploadedDocuments: `${__dirname}/uploads`,
    attachments: `${__dirname}/uploads`,
    customUploads: `${__dirname}/uploads`,
    temporalFiles: `${__dirname}/uploads`,
    activityLogs: `${__dirname}/uploads`,
  };

  const tenant = {
    name: 'tenant',
    dbName: 'tenant',
    indexName: 'tenant',
    ...folders,
  };

  const tenantTwo = {
    name: 'tenantTwo',
    dbName: 'tenantTwo',
    indexName: 'tenantTwo',
    ...folders,
  };

  let dbOne: Db;
  let dbTwo: Db;

  let mongod: MongoMemoryServer;

  afterAll(async () => {
    await DB.disconnect();
    await mongod.stop();
  });

  beforeAll(async () => {
    mongod = await createNewMongoDB();
    const mongoUri = mongod.getUri();
    await DB.connect(mongoUri);
  });

  beforeEach(async () => {
    twitterIntegration = new TwitterIntegration();
    dbOne = DB.connectionForDB(tenant.dbName).db;
    dbTwo = DB.connectionForDB(tenantTwo.dbName).db;

    tenants.tenants = { tenant };
    jest.spyOn(request, 'uploadFile').mockResolvedValue({});
    jest.resetAllMocks();
  });

  it('should do nothing with tenant without the twitter setup', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesTenantWithoutTwitter);

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).not.toHaveBeenCalled();
  });

  it('should send a twitter request', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneTenant);

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenant',
      task: 'get-hashtag',
    });
  });

  it('should send a twitter request for different tenants', async () => {
    await fixturer.clearAllAndLoad(dbTwo, fixturesOneTenant);
    await fixturer.clearAllAndLoad(dbTwo, fixturesOtherTenant);

    tenants.tenants = { tenant, tenantTwo };

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenant',
      task: 'get-hashtag',
    });

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#other-hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenantTwo',
      task: 'get-hashtag',
    });
  });

  it('should store one tweet', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneTenant);

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: { text: 'tweet text #hashtag_example', hashtags: ['#hashtag_example'] },
    });

    await tenants.run(async () => {
      const hashtagsEntities = await EntitiesModel.getUnrestricted({ title: '#hashtag_example' });
      const tweetsEntities = await EntitiesModel.getUnrestricted({ title: 'one' });

      const [tweetEntity] = tweetsEntities;
      expect(hashtagsEntities.length).toBe(1);
      expect(tweetEntity).toMatchObject({
        metadata: { text: [{ value: 'tweet text #hashtag_example' }] },
      });
    }, tenant.name);
  });

  it('should store another tweet', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesOneTenant);

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: {
        text: 'other tweet text #other_hashtag_example',
        hashtags: ['#other_hashtag_example'],
      },
    });

    await tenants.run(async () => {
      const hashtagsEntities = await EntitiesModel.getUnrestricted({
        title: '#other_hashtag_example',
      });
      const tweetsEntities = await EntitiesModel.getUnrestricted({ title: 'one' });

      const [tweetEntity] = tweetsEntities;
      expect(hashtagsEntities.length).toBe(1);
      expect(tweetEntity).toMatchObject({
        metadata: { text: [{ value: 'other tweet text #other_hashtag_example' }] },
      });
    }, tenant.name);
  });
});
