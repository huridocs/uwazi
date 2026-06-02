import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { EntitiesService } from './EntitiesService.js';

const InputSchema = z.object({
  sharedIds: z
    .array(z.string().trim())
    .min(1, 'You must provide at least one sharedId for bulk deletion')
    .max(1000, 'You must provide at most 1000 sharedIds for bulk deletion'),
});

type Input = z.infer<typeof InputSchema>;

type Output = { deletedSharedIds: string[] };

type Deps = {
  entitiesService: EntitiesService;
};

class BulkDeleteEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute({ sharedIds }: Input): Promise<Output> {
    const deletedSharedIds = await this.transactionManager.run(async () =>
      this.deps.entitiesService.bulkDelete(sharedIds, {
        actor: this.getActor(),
        tenantName: this.tenant.name,
      })
    );

    return { deletedSharedIds };
  }
}

export { BulkDeleteEntityUseCase };
export type { Input as BulkDeleteEntityInput, Output as BulkDeleteEntityOutput };
