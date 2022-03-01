import { ResultsMessage, TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import settings from 'api/settings/settings';
import entities from 'api/entities/entities';
import templates from 'api/templates';

class TwitterIntegration {
  static SERVICE_NAME = 'twitter-integration';
  public twitterTaskManager: TaskManager;

  constructor() {
    this.twitterTaskManager = new TaskManager({
      serviceName: TwitterIntegration.SERVICE_NAME,
      processResults: this.addTweetsRequestsToQueue,
    });
  }

  async addTweetsRequestsToQueue() {
    await Promise.all(
      Object.keys(tenants.tenants).map(async tenant => {
        await tenants.run(async () => {
          const settingsValues = await settings.get();
          if (
            !settingsValues.features ||
            !settingsValues.features.twitterIntegration ||
            !settingsValues.features.twitterIntegration.hashtags
          ) {
            return;
          }

          const hashtags: string[] = settingsValues.features.twitterIntegration.hashtags;

          await this.twitterTaskManager.startTask({
            task: 'get-hashtag',
            tenant,
            params: { hashtag: hashtags, fromUTCTimestamp: 0 },
          });
        }, tenant);
      })
    );
  }

  processResults = async (message: ResultsMessage): Promise<void> => {
    await tenants.run(async () => {
      const templateHashtags = await templates.get({ name: 'hashtags' });
      const templateTweets = await templates.get({ name: 'tweets' });

      for (const hastagName of message.params.hashtags) {
        await entities.save(
          {
            title: hastagName,
            template: templateHashtags[0]._id,
          },
          { user: {}, language: 'en' },
          { updateRelationships: false, includeDocuments: false }
        );
      }

      await entities.save(
        {
          title: 'one',
          metadata: { text: [{ value: message.params.text }] },
          template: templateTweets[0]._id,
        },
        { user: {}, language: 'en' },
        { updateRelationships: false }
      );
      // return files.save({ ...attachmentFile, entity: entity.sharedId, type: 'attachment' });
    }, message.tenant);
  };
}

export { TwitterIntegration };
