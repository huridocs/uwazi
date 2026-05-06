import { Db, FindCursor, ObjectId } from 'mongodb';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoDataSource, MongoDSOptions } from '../common/MongoDataSource.js';
import { fileDBO } from '../files/schemas/filesTypes.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type GetWithFilesMatch = {
  language?: LanguageISO6391;
  sharedId?: string | { $in: string[] };
  published?: boolean;
};

type EntityWithFiles = EntityDBO & { documents: fileDBO[]; attachments: fileDBO[] };

class MongoEntityDAO extends MongoDataSource<EntityDBO> {
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
              $project: { fullText: 0 },
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

  streamAll(): FindCursor<EntityDBO> {
    return this.getCollection().find({}).sort({ sharedId: 1 });
  }

  async getEntityIdsBySharedId(
    sharedIds: string[]
  ): Promise<{ _id: ObjectId; sharedId: string }[]> {
    return this.getCollection()
      .find({ sharedId: { $in: sharedIds } }, { projection: { _id: 1, sharedId: 1 } })
      .toArray();
  }

  async cloneForLanguage(from: LanguageISO6391, to: LanguageISO6391): Promise<void> {
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
            // eslint-disable-next-line no-await-in-loop
            await collection.bulkWrite(
              batch.map(({ _id: _discarded, ...rest }) => ({
                updateOne: {
                  filter: { sharedId: rest.sharedId, language: to },
                  update: { $setOnInsert: { ...rest, language: to } },
                  upsert: true,
                },
              })),
              { ordered: false }
            );
            batch = [];
          }
        }
      }
    } finally {
      await cursor.close();
    }
  }
}

export { MongoEntityDAO };
export type { EntityWithFiles };
