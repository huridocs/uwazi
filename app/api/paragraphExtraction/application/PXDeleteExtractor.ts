import { z } from 'zod';

import { UseCase } from 'api/common.v2/contracts/UseCase';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';

const InputSchema = z.object({
  id: z.string({ message: 'You should provide an Extractor ID' }),
});

type Input = z.infer<typeof InputSchema>;

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

export { PXDeleteExtractor, InputSchema };

export type { Input };
