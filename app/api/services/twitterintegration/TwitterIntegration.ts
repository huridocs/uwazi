import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import settings from 'api/settings/settings';

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
          const hashtags: string[] = settingsValues?.features?.twitterIntegration?.hashtags;

          if (!hashtags) {
            return;
          }

          await this.twitterTaskManager.startTask({
            task: 'get-hashtag',
            tenant,
            params: { hashtag: hashtags, fromUTCTimestamp: 0 },
          });
        }, tenant);
      })
    );
  }

  async processResults() {
    // return files.save({ ...attachmentFile, entity: entity.sharedId, type: 'attachment' });
  }
}

export { TwitterIntegration };
