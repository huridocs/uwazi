import { z } from 'zod';

import { UseCase } from 'api/common.v2/contracts/UseCase';

import { PXExtractParagraphsFromEntity } from './PXExtractParagraphsFromEntity';

type Input = z.infer<typeof InputSchema>;

type Output = any;

type Dependencies = {
  extractParagraphsFromEntity: PXExtractParagraphsFromEntity;
};

const InputSchema = z.object({
  userId: z.string({ message: 'You should provide an User Id' }),
  tenantName: z.string({ message: 'You should provide an Tenant name' }),
  extractorId: z.string({ message: 'You should provide an Extractor' }),
  entitySharedIds: z.array(z.string({ message: 'You should provide an Entity' })).min(1),
});

class PXExtractParagraphsFromEntities implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({ entitySharedIds, extractorId, tenantName, userId }: Input): Promise<Output> {
    await entitySharedIds.reduce(async (promise, entitySharedId) => {
      await promise;

      return this.dependencies.extractParagraphsFromEntity.execute({
        entitySharedId,
        extractorId,
        tenantName,
        userId,
      });
    }, Promise.resolve());
  }
}

/**
 * The idea here is to:
 * 1. Append each one of the input into a Queue
 * 2. This Queue would execute the [PXExtractParagraphsFromEntity!!] use case.
 *
 * This Queue must have the following requirements:
 * 1. Persist Tasks/Jobs (This will prevent from lost the Task if the process gets down)
 * 2. Retry mechanism
 * 3. Skip Tasks that exceeded the Retry limit and save those so us, developers see what when wrong and manually fix them
 * 4. Some how handle metadata (e.g., pending, in-progress, completed, failed) for a Task, this metadata should be associated with the Entity
 * 5. When making queries to populate our user interfaces, we should retrieve the Entity and associated status
 */

export { InputSchema, PXExtractParagraphsFromEntities };

export type { Input };
