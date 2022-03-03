import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import settings from 'api/settings/settings';
import entities from 'api/entities/entities';
import templates from 'api/templates';
import date from 'api/utils/date';

class TwitterIntegration {
  static SERVICE_NAME = 'twitter-integration';
  public twitterTaskManager: TaskManager;

  constructor() {
    this.twitterTaskManager = new TaskManager({
      serviceName: TwitterIntegration.SERVICE_NAME,
      processResults: this.addTweetsRequestsToQueue,
    });
  }
  async getTwitterIntegrationSettings(): Promise<
    | {
        hashtags: string[];
        hashtagsTemplateName: string;
        tweetsTemplateName: string;
      }
    | unknown
  > {
    const settingsValues = await settings.get();
    if (
      !settingsValues.features ||
      !settingsValues.features.twitterIntegration ||
      !settingsValues.features.twitterIntegration.hashtags
    ) {
      return;
    }

    return settingsValues.features.twitterIntegration;
  }

  async addTweetsRequestsToQueue() {
    await Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          const twitterIntegration = await this.getTwitterIntegrationSettings();

          if (!twitterIntegration) {
            return;
          }

          const { hashtags } = twitterIntegration;

          // eslint-disable-next-line @typescript-eslint/no-misused-promises,no-restricted-syntax
          for (const hashtag of hashtags) {
            // eslint-disable-next-line no-await-in-loop
            await this.twitterTaskManager.startTask({
              task: 'get-hashtag',
              tenant,
              params: { hashtag, fromUTCTimestamp: 0 },
            });
          }
        }, tenant);
      })
    );
  }

  processResults = async (message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      const twitterIntegration = await this.getTwitterIntegrationSettings();

      if (!twitterIntegration) {
        return;
      }

      const templatesHashtag = await templates.get({
        name: twitterIntegration.hashtagsTemplateName,
      });
      const templatesTweet = await templates.get({ name: twitterIntegration.tweetsTemplateName });

      const templateHashtag = templatesHashtag.length
        ? templatesHashtag[0]
        : await templates.save(
            {
              name: twitterIntegration.hashtagsTemplateName,
              commonProperties: [
                { name: 'title', label: 'Title', type: 'text' },
                { name: 'creationDate', label: 'Date added', type: 'date' },
              ],
            },
            'en'
          );

      const templateTweet = templatesTweet.length
        ? templatesTweet[0]
        : await templates.save(
            {
              name: twitterIntegration.tweetsTemplateName,
              commonProperties: [
                { name: 'title', label: 'Title', type: 'text' },
                { name: 'creationDate', label: 'Date added', type: 'date' },
              ],
              properties: [
                { name: 'tweet_text', label: 'Tweet text', type: 'markdown' },
                { name: 'tweet_source', label: 'Tweet source', type: 'link' },
                { name: 'tweet_author', label: 'Tweet author', type: 'link' },
                { name: 'tweet_date', label: 'Tweet date', type: 'date' },
              ],
            },
            'en'
          );

      // for (const hastagName of message.params.hashtags) {
      //   await entities.save(
      //     {
      //       title: hastagName,
      //       creationDate: 1588235233045,
      //       template: templateHashtag._id,
      //     },
      //     { user: {}, language: 'en' },
      //     { updateRelationships: false, includeDocuments: false }
      //   );
      // }

      await entities.save(
        {
          title: message.params.title,
          metadata: {
            tweet_text: [{ value: message.params.text }],
            tweet_source: [{ value: { label: 'link', url: message.params.source } }],
            tweet_author: [{ value: { label: message.params.user_name, url: message.params.user_url } }],
            tweet_date: [{ value: message.params.date }],
          },
          template: templateTweet._id,
        },
        { user: {}, language: 'en' },
        { updateRelationships: false }
      );
    }, message.tenant);
  };
}

export { TwitterIntegration };
