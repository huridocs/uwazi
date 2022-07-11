import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import settings from 'api/settings/settings';
import entities from 'api/entities/entities';
import templates from 'api/templates';
import relationtypes from 'api/relationtypes';
import {
  getTextWithAttachedImages,
  getTwitterImages,
  getTwitterImagesData,
  TwitterImageData,
} from 'api/services/twitterintegration/getTwitterImages';
import { permissionsContext } from 'api/permissions/permissionsContext';

interface TweetParamsType {
  title: string;
  text: string;
  source: string;
  // eslint-disable-next-line camelcase
  user: { display_name: string; url: string };
  // eslint-disable-next-line camelcase
  created_at: number;
  hashtags: string[];
  // eslint-disable-next-line camelcase
  images_urls: string[];
}

interface TwitterIntegrationSettingsType {
  searchQueries: string[];
  hashtagsTemplateName: string;
  tweetsTemplateName: string;
  language: string;
  tweetsLanguages: string[];
}

class TwitterIntegration {
  static SERVICE_NAME = 'twitter_crawler';

  public twitterTaskManager: TaskManager;

  constructor() {
    this.twitterTaskManager = new TaskManager({
      serviceName: TwitterIntegration.SERVICE_NAME,
      processResults: this.processResults,
    });
  }

  start() {
    this.twitterTaskManager.subscribeToResults();
  }

  getTwitterIntegrationSettings = async (): Promise<TwitterIntegrationSettingsType> => {
    const settingsValues = await settings.get({}, 'features');
    if (!settingsValues.features || !settingsValues.features.twitterIntegration) {
      return {
        searchQueries: [],
        hashtagsTemplateName: '',
        tweetsTemplateName: '',
        language: '',
        tweetsLanguages: [],
      };
    }

    return settingsValues.features.twitterIntegration as TwitterIntegrationSettingsType;
  };

  addTweetsRequestsToQueue = async () => {
    const pendingTasks = await this.twitterTaskManager.countPendingTasks();
    if (pendingTasks > 0) {
      return;
    }

    await Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          const twitterIntegration = await this.getTwitterIntegrationSettings();

          if (!twitterIntegration.hashtagsTemplateName) {
            return;
          }

          await this.getTemplateTweets(twitterIntegration);

          // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-restricted-syntax
          for (const hashtag of twitterIntegration.searchQueries) {
            // eslint-disable-next-line no-await-in-loop
            await this.twitterTaskManager.startTask({
              task: 'get-hashtag',
              tenant,
              params: {
                query: hashtag,
                tweets_languages:
                  twitterIntegration && twitterIntegration.tweetsLanguages
                    ? twitterIntegration.tweetsLanguages
                    : [],
              },
            });
          }
        }, tenant);
      })
    );
  };

  processResults = async (message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      permissionsContext.setCommandContext();
      const twitterIntegration = await this.getTwitterIntegrationSettings();

      if (!twitterIntegration.hashtagsTemplateName) {
        return;
      }

      const templateTweet = await this.getTemplateTweets(twitterIntegration);
      const tweetHashtags = await this.saveHashtags(twitterIntegration, message.params?.hashtags);

      const twitterImagesData: TwitterImageData[] = getTwitterImagesData(message);
      const textWithAttachedImages = getTextWithAttachedImages(message, twitterImagesData);
      const entity = await entities.save(
        {
          title: message.params?.title,
          metadata: {
            tweet_text: [{ value: textWithAttachedImages }],
            tweet_source: [{ value: { label: 'link', url: message.params?.source } }],
            tweet_author: [
              {
                value: { label: message.params?.user.display_name, url: message.params?.user.url },
              },
            ],
            tweet_date: [{ value: message.params?.created_at }],
            tweet_hashtags: tweetHashtags,
          },
          template: templateTweet._id,
        },
        { user: {}, language: twitterIntegration?.language }
      );

      await getTwitterImages(entity, twitterImagesData);
    }, message.tenant);
  };

  private saveHashtags = async (
    twitterIntegration: TwitterIntegrationSettingsType,
    hashtags: string[]
  ) => {
    const templateHashtag = await this.getHashtagsTemplate(twitterIntegration);

    const tweetHashtags = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const hashtag of hashtags) {
      // eslint-disable-next-line no-await-in-loop
      const hashtagEntities = await entities.getUnrestricted({
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

  private getTemplateTweets = async (twitterIntegration: TwitterIntegrationSettingsType) => {
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
          { name: 'tweet_text', label: 'Tweet text', type: 'markdown', showInCard: true },
          { name: 'tweet_source', label: 'Tweet source', type: 'link', showInCard: true },
          { name: 'tweet_author', label: 'Tweet author', type: 'link', showInCard: true },
          { name: 'tweet_date', label: 'Tweet date', type: 'date' },
          {
            name: 'tweet_hashtags',
            label: 'Tweet hashtags',
            type: 'relationship',
            relationType: relationType._id.toString(),
            content: hashtagsTemplate._id.toString(),
            filter: true,
          },
        ],
      },
      twitterIntegration.language
    );
  };

  getHashtagsTemplate = async (twitterIntegration: TwitterIntegrationSettingsType) => {
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
export type { TweetParamsType, TwitterIntegrationSettingsType };
