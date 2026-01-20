import { AbstractUseCase } from '#api/core/libs/UseCase.js';

type Input = {
  sharedId: string;
};

class LogEntityCreatedUseCase extends AbstractUseCase<Input, void> {
  async execute(input: Input): Promise<void> {
    console.log(`The Entity with sharedId = ${input.sharedId} has been created.`);
  }
}

export { LogEntityCreatedUseCase };
