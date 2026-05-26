import { Db, FindCursor, ObjectId } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { ProcessedPDFDBO } from './schemas/filesTypes.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

class MongoFilesDAO extends MongoDataSource<ProcessedPDFDBO> {
  protected collectionName = 'files';

  // Matches documents that have at least one non-whitespace page in fullText.
  // This mirrors the filtering done by FullTextElasticDocumentMapper so that
  // counts and cursors are always consistent with what actually gets indexed.
  private static readonly HAS_INDEXABLE_FULLTEXT = {
    $gt: [
      {
        $size: {
          $filter: {
            input: { $objectToArray: { $ifNull: ['$fullText', {}] } },
            cond: { $gt: [{ $strLenCP: { $trim: { input: '$$this.v' } } }, 0] },
          },
        },
      },
      0,
    ],
  };

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  streamProcessedDocs(options?: { afterId?: ObjectId }): FindCursor<ProcessedPDFDBO> {
    const filter: Record<string, unknown> = {
      type: 'document',
      status: 'ready',
      $expr: MongoFilesDAO.HAS_INDEXABLE_FULLTEXT,
    };
    if (options?.afterId) filter._id = { $gt: options.afterId };

    return this.getCollection().find(filter).sort({ _id: 1 });
  }

  streamProcessedDocsByIds(ids: ObjectId[]): FindCursor<ProcessedPDFDBO> {
    if (ids.length === 0) {
      return this.getCollection().find({ _id: { $in: [] } } as any);
    }
    return this.getCollection()
      .find({
        _id: { $in: ids },
        type: 'document',
        status: 'ready',
        $expr: MongoFilesDAO.HAS_INDEXABLE_FULLTEXT,
      } as any)
      .sort({ _id: 1 });
  }

  async countProcessedDocs(): Promise<number> {
    return this.getCollection().countDocuments({
      type: 'document',
      status: 'ready',
      $expr: MongoFilesDAO.HAS_INDEXABLE_FULLTEXT,
    } as any);
  }
}

export { MongoFilesDAO };
