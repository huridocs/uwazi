import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { fileDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { WithLookup } from '#api/core/infrastructure/mongodb/common/WithLookup.js';

type GetWithFilesMatch = {
  language?: LanguageISO6391;
  sharedId?: string;
};

class MongoEntityDAO extends MongoDataSource<EntityDBO> {
  protected collectionName = 'entities';

  getWithFile($match: GetWithFilesMatch) {
    return this.getCollection().aggregate<
      WithLookup<EntityDBO, { documents: fileDBO[]; attachments: fileDBO[] }>
    >([
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
        },
      },

      {
        $project: {
          files: 0,
        },
      },
    ]);
  }
}

export { MongoEntityDAO };
