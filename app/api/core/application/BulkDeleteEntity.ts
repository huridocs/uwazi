import { z } from 'zod';
import { search } from 'api/search';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { AbstractUseCase } from '../libs/UseCase';

const InputSchema = z.object({
  sharedIds: z.array(z.string().trim()).min(1).max(100),
});

type Input = z.infer<typeof InputSchema>;

type Output = Input;

type Deps = {
  search: typeof search;
  entitiesDS: MultiLanguageEntityDataSource;
};

class BulkDeleteEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  protected async executeAsync(input: Input): Promise<Output> {
    const { sharedIds } = InputSchema.parse(input);

    const entityResult = await this.deps.entitiesDS.getAllBySharedId(sharedIds);

    if (entityResult.isError()) {
      return input;
    }

    await this.transactionManager.run(async () => {
      await this.deps.entitiesDS.bulkDelete(sharedIds);
      await this.deps.search.bulkDeleteBySharedId(sharedIds);
    });

    await ArrayUtils.sequentialFor(entityResult.getData(), async entity =>
      this.eventBus.emit(EntityDeletedEvent.fromDomain(entity))
    );

    return input;
  }
}

export { BulkDeleteEntityUseCase };
export type { Input as BulkDeleteEntityUseCaseInput, Output as BulkDeleteEntityUseCaseOutput };
