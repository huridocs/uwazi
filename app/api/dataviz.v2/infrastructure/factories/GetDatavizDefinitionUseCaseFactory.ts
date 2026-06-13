import { GetDatavizDefinitionUseCase } from '#api/dataviz.v2/application/useCases/GetDatavizDefinition.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';

class GetDatavizDefinitionUseCaseFactory {
  static default() {
    const { tenant, actor } = ExecutionContext;

    return new GetDatavizDefinitionUseCase(
      { datavizDS: DatavizDataSourceFactory.default() },
      { actor, tenant }
    );
  }
}

export { GetDatavizDefinitionUseCaseFactory };
