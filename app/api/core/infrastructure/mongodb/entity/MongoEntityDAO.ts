import { Db } from 'mongodb';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoDataSource, MongoDSOptions } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { fileDBO } from '../files/schemas/filesTypes.js';

type GetWithFilesMatch = {
  language?: LanguageISO6391;
  sharedId?: string;
  published?: boolean;
};

type EntityWithFiles = EntityDBO & { documents: fileDBO[]; attachments: fileDBO[] };

class MongoEntityDAO extends MongoDataSource<EntityDBO> {
  protected collectionName = 'entities';

  private user: User;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
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
}

export { MongoEntityDAO };
export type { EntityWithFiles };
