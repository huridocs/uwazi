import { Db, ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
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
  private failedJobsCollectionName = 'jobs_failed';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager, { useSyncedCollection: false });
  }

  async renewJobLock(job: Job) {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    await this.getCollection().findOneAndUpdate(
      {
        _id: new ObjectId(job.id),
      },
      { $set: { lockedUntil: Date.now() + job.options.lockWindow } }
    );
  }

  async deleteJob(job: Job) {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    await this.getCollection().findOneAndDelete({
      _id: new ObjectId(job.id),
    });
  }

  protected async markExceededRetryJobsAsFailed(queueName: string): Promise<void> {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const exceededRetryJobs = await this.getCollection()
      .find({
        queue: queueName,
        retryCount: { $exists: true },
        'options.maxRetries': { $exists: true },
        $expr: { $gte: ['$retryCount', '$options.maxRetries'] },
        $or: [{ failed: false }, { failed: { $exists: false } }],
      })
      .toArray();

    if (exceededRetryJobs.length === 0) {
      return;
    }

    if (exceededRetryJobs.length > 0) {
      // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
      await this.getCollection(this.failedJobsCollectionName).insertMany(
        // @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
        exceededRetryJobs.map(job => ({ ...job, failed: true }))
      );

      // @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
      const jobIds = exceededRetryJobs.map(job => job._id);
      // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
      await this.getCollection().deleteMany({ _id: { $in: jobIds } });
    }
  }

  async pickJob(queueName: string): Promise<Job | null> {
    await this.markExceededRetryJobsAsFailed(queueName);

    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const result = await this.getCollection().findOneAndUpdate(
      {
        queue: queueName,
        lockedUntil: { $lt: Date.now() },
        $and: [
          { $or: [{ failed: false }, { failed: { $exists: false } }] },
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

  async moveToFailedJobs(job: Job) {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const jobToMove = await this.getCollection().findOne({ _id: new ObjectId(job.id) });
    if (!jobToMove) {
      throw new Error(`Job not found: ${job.id}`);
    }

    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    await this.getCollection(this.failedJobsCollectionName).insertOne(jobToMove);
    await this.deleteJob(job);
  }

  async markJobAsFailed(job: Job) {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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

    const updatedJob = {
      id: result._id.toHexString(),
      ...result,
    };

    await this.moveToFailedJobs(updatedJob);
    return updatedJob;
  }

  async updateLockWindow(job: Job, newLockWindow: number) {
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
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
