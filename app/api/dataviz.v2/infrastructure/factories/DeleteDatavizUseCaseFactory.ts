import { DeleteDatavizUseCase } from '#api/dataviz.v2/application/useCases/DeleteDataviz.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from './DatavizSnapshotsDataSourceFactory.js';
import { DatavizSchedulerServiceFactory } from './DatavizSchedulerServiceFactory.js';

class DeleteDatavizUseCaseFactory {
  static default() {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new DeleteDatavizUseCase(
      {
        transactionManager,
        datavizDS: DatavizDataSourceFactory.default(),
        snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
        scheduler: DatavizSchedulerServiceFactory.default(),
      },
      { actor, tenant }
    );
  }
}

export { DeleteDatavizUseCaseFactory };
