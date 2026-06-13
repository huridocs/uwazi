import { UpdateDatavizUseCase } from '#api/dataviz.v2/application/useCases/UpdateDataviz.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from './DatavizSnapshotsDataSourceFactory.js';
import { DatavizSchedulerServiceFactory } from './DatavizSchedulerServiceFactory.js';

class UpdateDatavizUseCaseFactory {
  static default() {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new UpdateDatavizUseCase(
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

export { UpdateDatavizUseCaseFactory };
