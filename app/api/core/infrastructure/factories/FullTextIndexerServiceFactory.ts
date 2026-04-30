import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import {
  FullTextIndexerService,
  FullTextIndexerServiceDeps,
} from '../elasticSearch/entities/FullTextIndexerService.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { FullTextESWriterFactory } from './FullTextESWriterFactory.js';

export class FullTextIndexerServiceFactory {
  static default(overrides?: Partial<FullTextIndexerServiceDeps>): FullTextIndexerService {
    const writer = FullTextESWriterFactory.default();

    const filesDAO = new MongoFilesDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
    });

    const fullTextIndexerService = new FullTextIndexerService({ filesDAO, writer, ...overrides });

    return fullTextIndexerService;
  }
}
