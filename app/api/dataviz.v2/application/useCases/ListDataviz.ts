import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';

type Input = void;

type Output = Dataviz[];

type Deps = {
  datavizDS: DatavizDataSource;
};

class ListDatavizUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(): Promise<Output> {
    return this.deps.datavizDS.list();
  }
}

export { ListDatavizUseCase };
