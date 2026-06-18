import { Db, FindCursor, ObjectId } from 'mongodb';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoDataSource, MongoDSOptions } from '../common/MongoDataSource.js';
import { FileDBO } from '../files/schemas/filesTypes.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type GetWithFilesMatch = {
  language?: LanguageISO6391;
  sharedId?: string | { $in: string[] };
  published?: boolean;
};

type EntityWithFiles = EntityDBO & { documents: FileDBO[]; attachments: FileDBO[] };

class MongoEntitiesDAO extends MongoDataSource<EntityDBO> {
  protected collectionName = 'entities';

  private user: User;

  constructor(
    db: Db,
    transactionManager: TransactionManager,
    user: User,
    options?: MongoDSOptions
  ) {
    super(db, transactionManager, options);
    this.user = user;
  }

  private buildPermissionMatch(): Record<string, unknown> {
    if (this.user.isPrivileged()) {
      return {};
    }

    const userIds = [this.user._id, ...this.user.groups];

    return {
      $or: [{ permissions: { $elemMatch: { refId: { $in: userIds } } } }, { published: true }],
    };
  }

  getWithFiles($match: GetWithFilesMatch) {
    const permissionMatch = this.buildPermissionMatch();

    return this.getCollection().aggregate<EntityWithFiles>([
      {
        $match: { ...$match, ...permissionMatch },
      },
      {
        $lookup: {
          from: 'files',
          localField: 'sharedId',
          foreignField: 'entity',
          as: 'files',

          pipeline: [
            {
              $project: { fullText: 0, __v: 0 },
            },
          ],
        },
      },

      {
        $addFields: {
          documents: {
            $filter: {
              input: '$files',
              as: 'document',
              cond: { $eq: ['$$document.type', 'document'] },
            },
          },
          attachments: {
            $filter: {
              input: '$files',
              as: 'attachment',
              cond: { $eq: ['$$attachment.type', 'attachment'] },
            },
          },
        },
      },

      {
        $unset: 'files',
      },
    ]);
  }

  streamAll(options?: { afterSharedId?: string }): FindCursor<EntityDBO> {
    const filter = options?.afterSharedId ? { sharedId: { $gt: options.afterSharedId } } : {};
    return this.getCollection().find(filter).sort({ sharedId: 1 });
  }

  streamSharedIds(options?: { afterSharedId?: string }): FindCursor<{ sharedId: string }> {
    const filter = options?.afterSharedId ? { sharedId: { $gt: options.afterSharedId } } : {};
    return this.getCollection()
      .find(filter, { projection: { sharedId: 1, _id: 0 } })
      .sort({ sharedId: 1 });
  }

  streamModifiedSince(date: Date): FindCursor<EntityDBO> {
    return this.getCollection()
      .find({ editDate: { $gte: date.getTime() } })
      .sort({ sharedId: 1 });
  }

  async getEntityIdsBySharedId(
    sharedIds: string[]
  ): Promise<{ _id: ObjectId; sharedId: string }[]> {
    return this.getCollection()
      .find({ sharedId: { $in: sharedIds } }, { projection: { _id: 1, sharedId: 1 } })
      .toArray();
  }

  async cloneForLanguage(
    from: LanguageISO6391,
    to: LanguageISO6391,
    onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 500;
    const collection = this.getCollection();
    const cursor = collection.find({ language: from });

    try {
      let batch: EntityDBO[] = [];

      // eslint-disable-next-line no-await-in-loop
      while (await cursor.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        const doc = await cursor.next();
        if (doc) batch.push(doc);

        // eslint-disable-next-line no-await-in-loop
        if (batch.length >= BATCH_SIZE || !(await cursor.hasNext())) {
          if (batch.length > 0) {
            const clonedEntities = batch.map(({ _id: _discarded, ...rest }) => ({
              ...rest,
              language: to,
            }));
            // eslint-disable-next-line no-await-in-loop
            await collection.bulkWrite(
              clonedEntities.map(entity => ({
                updateOne: {
                  filter: { sharedId: entity.sharedId, language: to },
                  update: { $setOnInsert: entity },
                  upsert: true,
                },
              })),
              { ordered: false }
            );
            // eslint-disable-next-line no-await-in-loop
            if (onBatch) await onBatch(clonedEntities);
            batch = [];
          }
        }
      }
    } finally {
      await cursor.close();
    }
  }

  async findBySharedIds(sharedIds: string[]): Promise<EntityDBO[]> {
    if (sharedIds.length === 0) return [];
    return this.getCollection()
      .find({ sharedId: { $in: sharedIds } })
      .toArray();
  }

  async countDistinctSharedIds(): Promise<number> {
    const result = await this.getCollection()
      .aggregate<{ count: number }>([{ $group: { _id: '$sharedId' } }, { $count: 'count' }])
      .toArray();
    return result[0]?.count ?? 0;
  }

  async deleteByLanguage(
    language: LanguageISO6391,
    onBatch?: (sharedIds: string[]) => Promise<void>
  ): Promise<void> {
    const BATCH_SIZE = 500;
    const collection = this.getCollection();
    const cursor = collection.find({ language }, { projection: { sharedId: 1 } });

    try {
      let batch: string[] = [];

      // eslint-disable-next-line no-await-in-loop
      while (await cursor.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        const doc = await cursor.next();
        if (doc) batch.push(doc.sharedId);

        // eslint-disable-next-line no-await-in-loop
        if (batch.length >= BATCH_SIZE || !(await cursor.hasNext())) {
          if (batch.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            await collection.deleteMany({ sharedId: { $in: batch }, language });
            // eslint-disable-next-line no-await-in-loop
            if (onBatch) await onBatch(batch);
            batch = [];
          }
        }
      }
    } finally {
      await cursor.close();
    }
  }
}

export { MongoEntitiesDAO };
export type { EntityWithFiles };
