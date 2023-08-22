import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { QueueAdapter, QueueMessage } from './QueueAdapter';

export class MongoQueueAdapter extends MongoDataSource implements QueueAdapter {
  protected collectionName = 'jobs';

  async renewJobLock(jobId: string, seconds: number) {
    await this.getCollection().findOneAndUpdate(
      {
        _id: new ObjectId(jobId),
      },
      { $set: { lockedUntil: Date.now() + seconds * 1000 } }
    );
  }

  async completeJob(jobId: string) {
    await this.getCollection().findOneAndDelete({
      _id: new ObjectId(jobId),
    });
  }

  async pickJob(queueName: string): Promise<{} | QueueMessage> {
    const result = await this.getCollection().findOneAndUpdate(
      { queue: queueName, lockedUntil: { $lt: Date.now() } },
      { $set: { lockedUntil: Date.now() + 1000 } },
      { sort: { createdAt: 1 } }
    );

    return result.value
      ? {
          id: result.value._id.toHexString(),
          message: result.value.message,
        }
      : {};
  }

  async pushJob(queueName: string, message: string): Promise<string> {
    const result = await this.getCollection().insertOne({
      queue: queueName,
      message,
      lockedUntil: 0,
      createdAt: Date.now(),
    });

    return result.insertedId.toHexString();
  }
}
