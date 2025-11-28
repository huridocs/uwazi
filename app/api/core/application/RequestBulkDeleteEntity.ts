import { z } from 'zod';
import { search } from 'api/search';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { AbstractUseCase } from '../libs/UseCase';
import { EntityPermissionChecker, Specification } from '../domain/entity/EntityPermissionChecker';
import { BulkDeleteEntityJob } from '../infrastructure/jobs/BatchDeleteEntityJob';

const InputSchema = z.object({
  sharedIds: z
    .array(z.string().trim())
    .min(1, 'You must provide at least one sharedId for bulk deletion')
    .max(1000, 'You must provide at most 1000 sharedIds for bulk deletion'),
});

type Input = z.infer<typeof InputSchema>;

type Output = Input;

type Deps = {
  entitiesDS: MultiLanguageEntityDataSource;
  search: typeof search;
  entityPermissionChecker: EntityPermissionChecker;
};

class RequestBulkDeleteEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  protected async executeAsync(input: Input): Promise<Output> {
    const { sharedIds } = InputSchema.parse({
      sharedIds: ArrayUtils.deduplicate(input.sharedIds, s => s),
    });

    const grantedSharedIds = (
      await this.deps.entityPermissionChecker.filterEntities(
        sharedIds,
        Specification.createDeleteSpecification(this.getActor())
      )
    ).getDataOrThrow();

    const chunks = ArrayUtils.splitInChunks(grantedSharedIds, 100);

    await this.transactionManager.run(async () => {
      await this.jobsDispatcher.dispatchMany(async dispatch =>
        chunks.forEach(chunk =>
          dispatch(BulkDeleteEntityJob, {
            sharedIds: chunk,
            userId: this.getActor()._id,
            tenantName: this.tenant.name,
          })
        )
      );

      await this.deps.entitiesDS.bulkDelete(grantedSharedIds);
      await this.deps.search.bulkDeleteBySharedId(grantedSharedIds);
    });

    return input;
  }
}

export { RequestBulkDeleteEntityUseCase };
export type { Input as RequestBulkDeleteEntityInput, Output as RequestBulkDeleteEntityOutput };
