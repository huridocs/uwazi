import { AbstractUseCase } from '../libs/UseCase';

type Input = {
  templateId: string;
};

type Output = Input;

type Deps = {};

class BulkDeleteEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync({}: Input): Promise<Output> {
    return {};
  }
}

export { BulkDeleteEntityUseCase };
