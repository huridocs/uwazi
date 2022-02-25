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

  const tenantOne = {
    name: 'tenantOne',
    dbName: 'tenantOne',
    indexName: 'tenantOne',
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
    dbOne = DB.connectionForDB(tenantOne.dbName).db;
    dbTwo = DB.connectionForDB(tenantTwo.dbName).db;

    tenants.tenants = { tenantOne };
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
      tenant: 'tenantOne',
      task: 'get-hashtag',
    });
  });

  it('should send a twitter request for different tenants', async () => {
    await fixturer.clearAllAndLoad(dbTwo, fixturesOneTenant);
    await fixturer.clearAllAndLoad(dbTwo, fixturesOtherTenant);

    tenants.tenants = { tenantOne, tenantTwo };

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenantOne',
      task: 'get-hashtag',
    });

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#other-hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenantTwo',
      task: 'get-hashtag',
    });
  });

  it('should store the ', async () => {
    await fixturer.clearAllAndLoad(dbTwo, fixturesOneTenant);
    await fixturer.clearAllAndLoad(dbTwo, fixturesOtherTenant);

    tenants.tenants = { tenantOne, tenantTwo };

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenantOne',
      task: 'get-hashtag',
    });

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { hashtag: ['#other-hashtag-example'], fromUTCTimestamp: 0 },
      tenant: 'tenantTwo',
      task: 'get-hashtag',
    });
  });


});
