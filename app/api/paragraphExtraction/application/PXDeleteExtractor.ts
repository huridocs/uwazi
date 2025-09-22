import { UseCase } from '../common.v2/contracts/UseCase.js';
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';

type Input = {
  id: string;
};

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  transactionManager: TransactionManager;
};

class PXDeleteExtractor implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    await this.dependencies.transactionManager.run(async () => {
      await this.dependencies.extractorsDS.delete(input.id);
    });
  }
}

export { PXDeleteExtractor };

export type { Input };
