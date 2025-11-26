import { z } from 'zod';
import { search } from 'api/search';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { AbstractUseCase } from '../libs/UseCase';
import { BatchDeleteEntityJob } from '../infrastructure/jobs/BatchDeleteEntityJob';

const InputSchema = z.object({
  sharedIds: z
    .array(z.string().trim())
    .min(1, 'You must provide at least one sharedId for bulk deletion')
    .max(1000, 'You must provide at most 1000 sharedIds for bulk deletion'),
});

type Input = z.infer<typeof InputSchema>;

type Output = Input;

type Deps = {
  search: typeof search;
};

class BulkDeleteEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  protected async executeAsync(input: Input): Promise<Output> {
    const { sharedIds } = InputSchema.parse(input);

    await this.deps.search.bulkDeleteBySharedId(sharedIds);

    const chunks = ArrayUtils.splitInChunks(sharedIds, 100);

    await ArrayUtils.sequentialFor(chunks, async chunk =>
      this.jobsDispatcher.dispatchMany(async dispatch =>
        dispatch(BatchDeleteEntityJob, { sharedIds: chunk })
      )
    );

    return input;
  }
}

export { BulkDeleteEntityUseCase };
export type { Input as BulkDeleteEntityInput, Output as BulkDeleteEntityOutput };
