import { UpdateDatavizUseCase } from '#api/dataviz.v2/application/useCases/UpdateDataviz.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from './DatavizSnapshotsDataSourceFactory.js';
import { DatavizQueryExecutorFactory } from './DatavizQueryExecutorFactory.js';
import { DatavizSchedulerServiceFactory } from './DatavizSchedulerServiceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';

class UpdateDatavizUseCaseFactory {
  static default() {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new UpdateDatavizUseCase(
      {
        transactionManager,
        datavizDS: DatavizDataSourceFactory.default(),
        snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
        queryExecutor: DatavizQueryExecutorFactory.default(),
        templatesDS: TemplatesDataSourceFactory.default(),
        scheduler: DatavizSchedulerServiceFactory.default(),
      },
      { actor, tenant }
    );
  }
}

export { UpdateDatavizUseCaseFactory };
