import { z } from 'zod';
import { EntityDeletedEvent } from '#api/entities/events/EntityDeletedEvent.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { FilesService } from './FilesService.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';

const InputSchema = z.object({
  sharedIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

type Input = z.infer<typeof InputSchema>;

type Output = Input;

type Deps = {
  filesService: FilesService;
  relationshipsDS: MongoRelationshipsV1DataSource;
  entitiesDS: EntitiesDataSource;
};

class BulkCleanupEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(input: Input): Promise<Output> {
    const { sharedIds } = InputSchema.parse(input);

    await this.transactionManager.run(async () => {
      await this.deps.entitiesDS.deleteReferencesToSharedIds(sharedIds);
      await this.deps.filesService.deleteEntityFiles(sharedIds);
      await this.deps.relationshipsDS.bulkDeleteBySharedId(sharedIds);
    });

    await ArrayUtils.sequentialFor(sharedIds, async sharedId =>
      this.eventBus.emit(EntityDeletedEvent.fromDomain(sharedId))
    );

    return input;
  }
}

export { BulkCleanupEntityUseCase };
export type { Input as BulkDeleteEntityUseCaseInput, Output as BulkDeleteEntityUseCaseOutput };
