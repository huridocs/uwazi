import { EntityDBO } from 'api/entities.v2/database/schemas/EntityTypes';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MongoDataSource } from '../common/MongoDataSource';
import { fileDBO } from '../files/schemas/filesTypes';
import { WithLookup } from '../common/WithLookup';

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
