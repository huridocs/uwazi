import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { RefreshDatavizSnapshotUseCase } from '#api/dataviz.v2/application/useCases/RefreshDatavizSnapshot.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from './DatavizSnapshotsDataSourceFactory.js';
import { DatavizQueryExecutorFactory } from './DatavizQueryExecutorFactory.js';

import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';

class RefreshDatavizSnapshotUseCaseFactory {
  static default(overrides?: { targetLanguage?: LanguageISO6391 }) {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new RefreshDatavizSnapshotUseCase(
      {
        transactionManager,
        datavizDS: DatavizDataSourceFactory.default(),
        snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
        queryExecutor: DatavizQueryExecutorFactory.default(),
        templatesDS: TemplatesDataSourceFactory.default(),
      },
      { actor, tenant, targetLanguage: overrides?.targetLanguage }
    );
  }
}

export { RefreshDatavizSnapshotUseCaseFactory };
