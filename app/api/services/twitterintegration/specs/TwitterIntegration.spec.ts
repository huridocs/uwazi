import { DB } from 'api/odm';
import { fixturer, createNewMongoDB, testingDB } from 'api/utils/testing_db';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  TweetParamsType,
  TwitterIntegration,
} from 'api/services/twitterintegration/TwitterIntegration';
import { Db } from 'mongodb';
import {
  fixturesOneTenant,
  fixturesOtherTenant,
  fixturesTenantWithoutTwitter,
  fixturesWithTweets,
} from 'api/services/twitterintegration/specs/fixtures';
import { tenants } from 'api/tenants';
import EntitiesModel from 'api/entities/entitiesModel';
import templates from 'api/templates/templates';

jest.mock('api/services/tasksmanager/TaskManager.ts');

const ONE_TWEET_PARAMS: TweetParamsType = {
  title: 'tweet title',
  text: 'tweet text',
  source: 'url',
  user: { display_name: 'user', url: 'user_url' },
  created_at: 1645747200,
  hashtags: ['#other_hashtag_example', '#hashtag_example'],
  images: [],
};

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

  const tenant2 = {
    name: 'tenant2',
    dbName: 'tenant2',
    indexName: 'tenant2',
    ...folders,
  };

  let dbOne: Db;

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

    tenants.tenants = { tenant };
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should do nothing with tenant without the twitter setup', async () => {
    await fixturer.clearAllAndLoad(dbOne, fixturesTenantWithoutTwitter);

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).not.toHaveBeenCalled();
  });

  it('should send a twitter requests', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, 'tenant');

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { query: '#hashtag-example', from_UTC_timestamp: 0, tweets_languages: ['en'] },
      tenant: 'tenant',
      task: 'get-hashtag',
    });
  });

  it('should send a twitter request for different tenant', async () => {
    await testingDB.setupFixturesAndContext(fixturesOtherTenant, 'tenant2');

    tenants.tenants = { tenant2 };

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: {
        query: '#other-hashtag-example',
        from_UTC_timestamp: 0,
        tweets_languages: ['es', 'my'],
      },
      tenant: 'tenant2',
      task: 'get-hashtag',
    });

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: {
        query: '#other-hashtag-example2',
        from_UTC_timestamp: 0,
        tweets_languages: ['es', 'my'],
      },
      tenant: 'tenant2',
      task: 'get-hashtag',
    });
  });

  it('should send a twitter request with the timestamp of last tweet', async () => {
    await testingDB.clearAllAndLoad(fixturesWithTweets);

    tenants.tenants = { tenant };

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { query: '#hashtag-example', from_UTC_timestamp: 12345, tweets_languages: ['en'] },
      tenant: 'tenant',
      task: 'get-hashtag',
    });
  });

  it('should create templates if they do not exist', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, 'tenant');

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    await tenants.run(async () => {
      const [hashtagTemplate] = await templates.get({ name: 'Hashtags' });
      const [tweetsTemplate] = await templates.get({ name: 'Tweets' });
      expect(hashtagTemplate.name).toBe('Hashtags');
      expect(tweetsTemplate.name).toBe('Tweets');
    }, tenant.name);
  });

  it('should create other templates if they do not exist', async () => {
    await testingDB.setupFixturesAndContext(fixturesOtherTenant, 'tenant');

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    await tenants.run(async () => {
      const [hashtagTemplate] = await templates.get({ name: 'OtherHashtags' });
      const [tweetsTemplate] = await templates.get({ name: 'OtherTweets' });
      expect(hashtagTemplate.name).toBe('OtherHashtags');
      expect(tweetsTemplate.name).toBe('OtherTweets');
    }, tenant.name);
  });

  it('should store one tweet', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, 'tenant');

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    await tenants.run(async () => {
      const tweetsEntities = await EntitiesModel.getUnrestricted({ title: 'tweet title' });

      const [tweetEntity] = tweetsEntities;
      expect(tweetsEntities.length).toBe(1);
      expect(tweetEntity).toMatchObject({
        title: 'tweet title',
        metadata: {
          tweet_text: [{ value: 'tweet text' }],
          tweet_source: [{ value: { label: 'link', url: 'url' } }],
          tweet_author: [{ value: { label: 'user', url: 'user_url' } }],
          tweet_date: [{ value: 1645747200 }],
        },
      });
    }, tenant.name);
  });

  it('should store the hashtags', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, 'tenant');

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    await tenants.run(async () => {
      const hashtagsEntities = await EntitiesModel.getUnrestricted({
        $or: [{ title: '#other_hashtag_example' }, { title: '#hashtag_example' }],
      });
      const tweetsEntities = await EntitiesModel.getUnrestricted({
        $nor: [{ title: '#other_hashtag_example' }, { title: '#hashtag_example' }],
      });

      const tweetEntity = tweetsEntities[0];
      expect(hashtagsEntities.length).toBe(2);
      expect(hashtagsEntities.map(x => x.title)).toEqual([
        '#other_hashtag_example',
        '#hashtag_example',
      ]);
      expect(tweetEntity.metadata?.tweet_hashtags).toMatchObject(
        hashtagsEntities.map(x => ({
          value: x.sharedId,
        }))
      );
    }, tenant.name);
  });

  it('should download and replace the images in the twitter text', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, 'tenant');

    const imageParams = { ...ONE_TWEET_PARAMS };
    imageParams.text = 'tweet text ![image](http://image.is)';
    imageParams.images = ['https://image.is'];

    await twitterIntegration.processResults({
      tenant: tenant.name,
      task: 'get-hashtag',
      params: imageParams,
    });
  });
});
