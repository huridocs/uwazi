import { ListDatavizUseCase } from '#api/dataviz.v2/application/useCases/ListDataviz.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';

class ListDatavizUseCaseFactory {
  static default() {
    const { tenant, actor } = ExecutionContext;

    return new ListDatavizUseCase(
      { datavizDS: DatavizDataSourceFactory.default() },
      { actor, tenant }
    );
  }
}

export { ListDatavizUseCaseFactory };
