import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { fileDBO } from '../files/schemas/filesTypes.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';

type GetWithFilesMatch = {
  language?: LanguageISO6391;
  sharedId?: string;
  published?: boolean;
};

type EntityWithFiles = EntityDBO & { documents: fileDBO[]; attachments: fileDBO[] };

class MongoEntityDAO extends MongoDataSource<EntityDBO> {
  protected collectionName = 'entities';

  getWithFiles($match: GetWithFilesMatch) {
    return this.getCollection().aggregate<EntityWithFiles>([
      {
        $match,
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
          // Explicitly preserve published field
          published: { $ifNull: ['$published', false] },
        },
      },

      {
        $unset: 'files',
      },
    ]);
  }
}

export { MongoEntityDAO };
