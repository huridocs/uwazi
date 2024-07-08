import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { ObjectId } from 'mongodb';
import { Job, QueueAdapter } from './QueueAdapter';

interface JobDBO {
  _id: ObjectId;
  queue: string;
  name: string;
  params: any;
  namespace: string;
  lockedUntil: number;
  createdAt: number;
  options: {
    lockWindow: number;
  };
}

export class MongoQueueAdapter extends MongoDataSource<JobDBO> implements QueueAdapter {
  protected collectionName = 'jobs';

  async renewJobLock(job: Job) {
    await this.getCollection().findOneAndUpdate(
      {
        _id: new ObjectId(job.id),
      },
      { $set: { lockedUntil: Date.now() + job.options.lockWindow } }
    );
  }

  async deleteJob(job: Job) {
    await this.getCollection().findOneAndDelete({
      _id: new ObjectId(job.id),
    });
  }

  async pickJob(queueName: string): Promise<Job | null> {
    const result = await this.getCollection().findOneAndUpdate(
      { queue: queueName, lockedUntil: { $lt: Date.now() } },
      [{ $set: { lockedUntil: { $sum: [Date.now(), '$options.lockWindow'] } } }],
      { sort: { createdAt: 1 }, returnDocument: 'after' }
    );

    if (result) {
      const { _id, ...withoutId } = result;
      return {
        id: result._id.toHexString(),
        ...withoutId,
      };
    }

    return null;
  }

  async pushJob(job: Omit<Job, 'id' | 'lockedUntil' | 'createdAt'>): Promise<string> {
    const result = await this.getCollection().insertOne({
      _id: new ObjectId(),
      lockedUntil: 0,
      createdAt: Date.now(),
      ...job,
    });

    return result.insertedId.toHexString();
  }
}
