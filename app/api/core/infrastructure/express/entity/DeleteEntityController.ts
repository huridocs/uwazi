import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { BulkDeleteEntityUseCaseFactory } from '../../factories/BulkDeleteEntityUseCaseFactory.js';
import { tenants } from '#api/tenants/index.js';
import entities from '#api/entities/entities.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';

const RequestSchema = z.object({
  sharedId: z.string().trim().min(1, 'sharedId is required'),
});

type RequestDto = z.infer<typeof RequestSchema>;

class DeleteEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const { sharedId } = RequestSchema.parse(this.request.query);
      if (tenants.current().featureFlags?.v2DeleteEntity) {
        const useCase = BulkDeleteEntityUseCaseFactory.default();

        await useCase.execute({ sharedIds: [sharedId] });

        DependenciesContext.logger.info('Entity Deleted executed successfully', {
          namespace: 'Entity_Delete',
          success: true,
          durationMs: Date.now() - startTime,

          sharedId,
        });

        this.response.json([]);
      } else {
        const output = await entities.delete(sharedId);

        this.response.json(output);
      }
    } catch (error: unknown) {
      if (tenants.current().featureFlags?.v2DeleteEntity) {
        const duration = Date.now() - startTime;

        DependenciesContext.logger.info(
          `Entity Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            namespace: 'Entity_Delete',
            durationMs: duration,
            success: false,
            notify: true,

            error: JSON.stringify(error),
            dto: JSON.stringify(this.request.query),
          }
        );
      }

      throw error;
    }
  }
}

export { DeleteEntityController };
