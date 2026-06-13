import { CreateDatavizUseCase } from '#api/dataviz.v2/application/useCases/CreateDataviz.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSchedulerServiceFactory } from './DatavizSchedulerServiceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';

class CreateDatavizUseCaseFactory {
  static default() {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new CreateDatavizUseCase(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        datavizDS: DatavizDataSourceFactory.default(),
        scheduler: DatavizSchedulerServiceFactory.default(),
      },
      { actor, tenant }
    );
  }
}

export { CreateDatavizUseCaseFactory };
