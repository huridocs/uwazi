import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RelationshipTypesDataSourceFactory } from '#api/core/infrastructure/factories/RelationshipTypesDataSourceFactory.js';

import { PXCreateExtractor } from '../application/PXCreateExtractor.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';

export class PXCreateExtractorFactory {
  static async createDefault() {
    const connection = getConnection();
    const { transactionManager, mongoTransactionManager } = ExecutionContext;
    const relationshipTypeDS = RelationshipTypesDataSourceFactory.default({
      transactionManager,
    });

    return new PXCreateExtractor({
      relationshipTypeDS,
      extractorDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      idGenerator: MongoIdHandler,
      templatesDS: TemplatesDataSourceFactory.default({
        transactionManager,
      }),
      transactionManager,
      dispatcher: ExecutionContext.jobsDispatcher,
    });
  }
}
