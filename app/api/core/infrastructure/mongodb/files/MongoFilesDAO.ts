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

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  streamProcessedDocs(options?: { afterId?: ObjectId }): FindCursor<ProcessedPDFDBO> {
    const filter: Record<string, unknown> = { type: 'document', status: 'ready' };
    if (options?.afterId) filter._id = { $gt: options.afterId };

    return this.getCollection().find(filter).sort({ _id: 1 });
  }
}

export { MongoFilesDAO };
