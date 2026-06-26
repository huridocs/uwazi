import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { DatavizNotFoundError } from '#api/dataviz.v2/domain/errors.js';

type Input = { id: string };

type Output = Dataviz;

type Deps = {
  datavizDS: DatavizDataSource;
};

class GetDatavizDefinitionUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ id }: Input): Promise<Output> {
    const result = await this.deps.datavizDS.getById(id);
    if (result.isError()) {
      throw new DatavizNotFoundError(id);
    }
    return result.getDataOrThrow();
  }
}

export { GetDatavizDefinitionUseCase };
