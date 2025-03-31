import { UseCase } from 'api/common.v2/contracts/UseCase';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';

type Input = {
  extractorId: string;
};

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
};

class PXDeleteExtractor implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    await this.dependencies.extractorsDS.delete(input.extractorId);
  }
}

export { PXDeleteExtractor };

export type { Input };
