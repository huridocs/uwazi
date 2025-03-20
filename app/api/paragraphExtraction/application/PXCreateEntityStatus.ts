import { UseCase } from 'api/common.v2/contracts/UseCase';

type Input = any;
type Output = any;

class PXCreateEntityStatus implements UseCase<Input, Output> {
  async execute(input: Input): Promise<Output> {
    throw new Error('Method not implemented.');
  }
}

export { PXCreateEntityStatus };
