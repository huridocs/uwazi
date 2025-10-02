import { MongoQueueAdapter } from './MongoQueueAdapter';
import { Job } from './QueueAdapter';

export class RoundRobinMongoQueueAdapter extends MongoQueueAdapter {
  private latestTenants: string[] = ['', ''];

  private async findAndUpdateJob(queueName: string, excludeTenants: string[] = []) {
    // eslint-disable-next-line no-return-await
    return await super.getCollection().findOneAndUpdate(
      {
        queue: queueName,
        lockedUntil: { $lt: Date.now() },
        namespace: { $nin: excludeTenants },
        $and: [
          { $or: [{ failed: false }, { failed: undefined }, { failed: { $exists: false } }] },
          {
            $expr: { $lt: ['$retryCount', '$options.maxRetries'] },
          },
        ],
      },
      [
        {
          $set: {
            lockedUntil: { $sum: [Date.now(), '$options.lockWindow'] },
            retryCount: { $add: ['$retryCount', 1] },
          },
        },
      ],
      { sort: { createdAt: 1, _id: 1 }, returnDocument: 'after' }
    );
  }

  async pickJob(queueName: string): Promise<Job | null> {
    await this.markExceededRetryJobsAsFailed(queueName);

    const result = await this.findAndUpdateJob(queueName, this.latestTenants);
    let job: Job | null = null;
    if (result) {
      const { _id, ...withoutId } = result;
      job = {
        ...withoutId,
        id: _id.toHexString(),
        failed: typeof withoutId.failed === 'boolean' ? withoutId.failed : false,
      } as Job;
    } else {
      job = await super.pickJob(queueName);
    }
    if (job) {
      this.latestTenants.shift();
      this.latestTenants.push(job.namespace || '');
    }
    return job;
  }
}
