import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { Job, QueueAdapter } from './QueueAdapter';

export interface JobDBO {
  _id: ObjectId;
  queue: string;
  name: string;
  params: any;
  namespace: string;
  lockedUntil: number;
  createdAt: number;
  retryCount: number;
  failed: boolean;
  options: {
    lockWindow: number;
    maxRetries: number;
  };
}

export class MongoQueueAdapter extends MongoDataSource<JobDBO> implements QueueAdapter {
  protected collectionName = 'jobs';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager, { useSyncedCollection: false });
  }

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
      {
        queue: queueName,
        lockedUntil: { $lt: Date.now() },
        $or: [{ failed: false }, { failed: { $exists: false } }],
      },
      [
        {
          $set: {
            lockedUntil: { $sum: [Date.now(), '$options.lockWindow'] },
            retryCount: { $add: ['$retryCount', 1] },
          },
        },
      ],
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

  async markJobAsFailed(job: Job) {
    const result = await this.getCollection().findOneAndUpdate(
      {
        _id: new ObjectId(job.id),
      },
      { $set: { failed: true } },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error(`Failed to mark job as failed: ${job.id}`);
    }

    return {
      id: result._id.toHexString(),
      ...result,
    };
  }

  async updateLockWindow(job: Job, newLockWindow: number) {
    const result = await this.getCollection().findOneAndUpdate(
      {
        _id: new ObjectId(job.id),
      },
      { $set: { 'options.lockWindow': newLockWindow } },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error(`Failed to update lock window for job: ${job.id}`);
    }

    return {
      id: result._id.toHexString(),
      ...result,
    };
  }

  async pushJob(
    job: Omit<Job, 'id' | 'lockedUntil' | 'createdAt' | 'retryCount'>
  ): Promise<string> {
    const result = await this.getCollection().insertOne({
      _id: new ObjectId(),
      lockedUntil: 0,
      createdAt: Date.now(),
      retryCount: 0,
      failed: false,
      ...job,
    });

    return result.insertedId.toHexString();
  }
}
