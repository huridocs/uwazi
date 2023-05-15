import { testingDB } from 'api/utils/testing_db';
import * as filesApi from 'api/files/filesystem';
import { storage, files } from 'api/files';
import {
  TweetParamsType,
  TwitterIntegration,
} from 'api/services/twitterintegration/TwitterIntegration';
import {
  fixturesOneTenant,
  fixturesOtherTenant,
  fixturesTenantWithoutTwitter,
} from 'api/services/twitterintegration/specs/fixtures';
import EntitiesModel from 'api/entities/entitiesModel';
import templates from 'api/templates/templates';
import { testingTenants } from 'api/utils/testingTenants';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { tenants } from 'api/tenants';
import fetchMock from 'fetch-mock';

jest.mock('api/services/tasksmanager/TaskManager.ts');
jest.mock('api/socketio/setupSockets');

const ONE_TWEET_PARAMS: TweetParamsType = {
  title: 'tweet title',
  text: 'tweet text',
  source: 'url',
  user: { display_name: 'user', url: 'user_url' },
  created_at: 1645747200,
  hashtags: ['#other_hashtag_example', '#hashtag_example'],
  images_urls: [],
};

const tenantName = 'tenant_twitter_integration';

describe('TwitterIntegration', () => {
  let twitterIntegration: TwitterIntegration;

  beforeEach(async () => {
    twitterIntegration = new TwitterIntegration();

    const folders = {
      uploadedDocuments: `${__dirname}/uploads`,
      attachments: `${__dirname}/uploads`,
      customUploads: `${__dirname}/uploads`,
      activityLogs: `${__dirname}/uploads`,
    };

    const tenant1 = {
      name: tenantName,
      dbName: tenantName,
      indexName: tenantName,
      ...folders,
    };

    tenants.tenants = { tenant_twitter_integration: tenant1 };

    jest.resetAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should do nothing with tenant without the twitter setup', async () => {
    await testingEnvironment.setUp(fixturesTenantWithoutTwitter);
    testingTenants.changeCurrentTenant({
      name: tenantName,
    });
    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).not.toHaveBeenCalled();
  });

  it('should send a twitter requests', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, tenantName);

    await twitterIntegration.addTweetsRequestsToQueue();

    expect(twitterIntegration.twitterTaskManager.startTask).toHaveBeenCalledWith({
      params: { query: '#hashtag-example', tweets_languages: ['en'] },
      tenant: tenantName,
      task: 'get-hashtag',
    });
  });

  it('should create templates if they do not exist', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, tenantName);

    await twitterIntegration.processResults({
      tenant: tenantName,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    const [hashtagTemplate] = await templates.get({ name: 'Hashtags' });
    const [tweetsTemplate] = await templates.get({ name: 'Tweets' });
    expect(hashtagTemplate.name).toBe('Hashtags');
    expect(tweetsTemplate.name).toBe('Tweets');
  });

  it('should create other templates if they do not exist', async () => {
    await testingDB.setupFixturesAndContext(fixturesOtherTenant, tenantName);

    await twitterIntegration.processResults({
      tenant: tenantName,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    const [hashtagTemplate] = await templates.get({ name: 'OtherHashtags' });
    const [tweetsTemplate] = await templates.get({ name: 'OtherTweets' });
    expect(hashtagTemplate.name).toBe('OtherHashtags');
    expect(tweetsTemplate.name).toBe('OtherTweets');
  });

  it('should store one tweet', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, tenantName);

    await twitterIntegration.processResults({
      tenant: tenantName,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

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
  });

  it('should store the hashtags', async () => {
    await testingDB.setupFixturesAndContext(fixturesOneTenant, tenantName);

    await twitterIntegration.processResults({
      tenant: tenantName,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

    await twitterIntegration.processResults({
      tenant: tenantName,
      task: 'get-hashtag',
      params: ONE_TWEET_PARAMS,
    });

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
  });

  it('should download and replace the images in the twitter text', async () => {
    const storeFileSpy = jest.spyOn(storage, 'storeFile').mockResolvedValue();
    jest.spyOn(filesApi, 'generateFileName').mockReturnValue('generatedUwaziFilename');

    fetchMock.mock('https://image.is', {
      body: 'resultFileContent',
      status: 200,
      headers: { 'Content-Type': 'some/mimetype' },
    });

    await testingDB.setupFixturesAndContext(fixturesOneTenant, tenantName);

    const imageParams = {
      ...ONE_TWEET_PARAMS,
      text: 'tweet text ![image](https://image.is)',
      images_urls: ['https://image.is'],
    };

    await twitterIntegration.processResults({
      tenant: tenantName,
      task: 'get-hashtag',
      params: imageParams,
    });

    const fileDocuments = await files.get();
    const tweetsEntities = await EntitiesModel.getUnrestricted({ title: ONE_TWEET_PARAMS.title });

    expect(fileDocuments.length).toBe(1);
    expect(tweetsEntities.length).toBe(1);
    expect(fetchMock.lastUrl()).toBe('https://image.is/');
    expect(fileDocuments[0]).toMatchObject({
      entity: tweetsEntities[0].sharedId,
      filename: 'generatedUwaziFilename',
      originalname: 'image.is',
      type: 'attachment',
    });
    expect(storeFileSpy).toHaveBeenCalledWith(
      'generatedUwaziFilename',
      expect.anything(),
      expect.anything()
    );
    expect(tweetsEntities[0]).toMatchObject({
      metadata: {
        tweet_text: [
          {
            value: 'tweet text ![image](/api/files/generatedUwaziFilename)',
          },
        ],
      },
    });
  });
});
