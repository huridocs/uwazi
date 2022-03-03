import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import settings from 'api/settings/settings';
import entities from 'api/entities/entities';
import templates from 'api/templates';
import EntitiesModel from 'api/entities/entitiesModel';
import relationtypes from 'api/relationtypes';

class TwitterIntegration {
  static SERVICE_NAME = 'twitter_crawler';
  public twitterTaskManager: TaskManager;

  constructor() {
    this.twitterTaskManager = new TaskManager({
      serviceName: TwitterIntegration.SERVICE_NAME,
      processResults: this.addTweetsRequestsToQueue,
    });
  }

  getTwitterIntegrationSettings = async (): Promise<
    | {
        hashtags: string[];
        hashtagsTemplateName: string;
        tweetsTemplateName: string;
        language: string;
      }
    | unknown
  > => {
    const settingsValues = await settings.get();
    if (!settingsValues.features || !settingsValues.features.twitterIntegration) {
      return;
    }

    return settingsValues.features.twitterIntegration;
  };

  addTweetsRequestsToQueue = async () => {
    await Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          const twitterIntegration = await this.getTwitterIntegrationSettings();

          if (!twitterIntegration) {
            return;
          }

          const templateTweet = await this.getTemplateTweets(twitterIntegration);
          const newestEntity = await EntitiesModel.getUnrestricted(
            { template: templateTweet._id },
            'metadata.tweet_date',
            { limit: 1, sort: { 'metadata.tweet_date': -1 } }
          );

          const utcTimestampEntities = newestEntity.length
            ? newestEntity[0].metadata.tweet_date[0].value
            : 0;

          const { hashtags } = twitterIntegration;

          // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-restricted-syntax
          for (const hashtag of hashtags) {
            // eslint-disable-next-line no-await-in-loop
            await this.twitterTaskManager.startTask({
              task: 'get-hashtag',
              tenant,
              params: { query: hashtag, from_UTC_timestamp: utcTimestampEntities },
            });
          }
        }, tenant);
      })
    );
  };

  processResults = async (message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      const twitterIntegration = await this.getTwitterIntegrationSettings();

      if (!twitterIntegration) {
        return;
      }

      const templateTweet = await this.getTemplateTweets(twitterIntegration);
      const tweetHashtags = await this.saveHashtags(twitterIntegration, message.params.hashtags);

      await entities.save(
        {
          title: message.params.title,
          metadata: {
            tweet_text: [{ value: message.params.text }],
            tweet_source: [{ value: { label: 'link', url: message.params.source } }],
            tweet_author: [
              { value: { label: message.params.user.display_name, url: message.params.user.url } },
            ],
            tweet_date: [{ value: message.params.created_at }],
            tweet_hashtags: tweetHashtags,
          },
          template: templateTweet._id,
        },
        { user: {}, language: twitterIntegration.language },
        { updateRelationships: false }
      );
    }, message.tenant);
  };

  private saveHashtags = async (twitterIntegration, hashtags: string[]) => {
    const templateHashtag = await this.getHashtagsTemplate(twitterIntegration);

    const tweetHashtags = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const hashtag of hashtags) {
      // eslint-disable-next-line no-await-in-loop
      const hashtagEntities = await entities.get({
        title: hashtag.toString(),
        template: templateHashtag._id,
      });

      if (hashtagEntities.length) {
        tweetHashtags.push({
          value: hashtagEntities[0].sharedId,
          type: 'entity',
          icon: null,
        });
      } else {
        // eslint-disable-next-line no-await-in-loop
        const savedEntity = await entities.save(
          {
            title: hashtag.toString(),
            template: templateHashtag._id,
          },
          { user: {}, language: twitterIntegration.language }
        );
        tweetHashtags.push({
          value: savedEntity.sharedId,
          type: 'entity',
          icon: null,
        });
      }
    }
    return tweetHashtags;
  };

  private getTemplateTweets = async twitterIntegration => {
    const templatesTweet = await templates.get({ name: twitterIntegration.tweetsTemplateName });

    if (templatesTweet.length) {
      return templatesTweet[0];
    }

    const hashtagsTemplate = await this.getHashtagsTemplate(twitterIntegration);

    const relationsType = await relationtypes.get({ name: 'Twitter query' });

    const relationType = relationsType.length
      ? relationsType[0]
      : await relationtypes.save({ name: 'Twitter query' });

    return templates.save(
      {
        name: twitterIntegration.tweetsTemplateName,
        commonProperties: [
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'creationDate', label: 'Date added', type: 'date' },
          { name: 'editDate', label: 'Date modified', type: 'date' },
        ],
        properties: [
          { name: 'tweet_text', label: 'Tweet text', type: 'markdown' },
          { name: 'tweet_source', label: 'Tweet source', type: 'link' },
          { name: 'tweet_author', label: 'Tweet author', type: 'link' },
          { name: 'tweet_date', label: 'Tweet date', type: 'date' },
          {
            name: 'tweet_hashtags',
            label: 'Tweet Hashtags',
            type: 'relationship',
            relationType: relationType._id.toString(),
            content: hashtagsTemplate._id.toString(),
          },
        ],
      },
      twitterIntegration.language
    );
  };

  private getHashtagsTemplate = async twitterIntegration => {
    const templatesHashtag = await templates.get({
      name: twitterIntegration.hashtagsTemplateName,
    });

    return templatesHashtag.length
      ? templatesHashtag[0]
      : templates.save(
          {
            name: twitterIntegration.hashtagsTemplateName,
            commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
          },
          twitterIntegration.language
        );
  };
}

export { TwitterIntegration };
