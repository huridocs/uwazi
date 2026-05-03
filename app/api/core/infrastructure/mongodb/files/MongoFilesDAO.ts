import { Db, FindCursor } from 'mongodb';
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

  streamProcessedDocs(): FindCursor<ProcessedPDFDBO> {
    return this.getCollection().find({ type: 'document', status: 'ready' });
  }
}

export { MongoFilesDAO };
