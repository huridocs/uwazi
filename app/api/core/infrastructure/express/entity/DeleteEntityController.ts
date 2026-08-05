import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { BulkDeleteEntityUseCaseFactory } from '../../factories/BulkDeleteEntityUseCaseFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const RequestSchema = z.object({
  sharedId: z.string().trim().min(1, 'sharedId is required'),
});

type RequestDto = z.infer<typeof RequestSchema>;

class DeleteEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const { sharedId } = RequestSchema.parse(this.request.query);

      const useCase = BulkDeleteEntityUseCaseFactory.default();

      await useCase.execute({ sharedIds: [sharedId] });

      ExecutionContext.logger.info('Entity Deleted executed successfully', {
        namespace: 'Entity_Delete',
        success: true,
        durationMs: Date.now() - startTime,

        sharedId,
      });

      this.response.json([]);
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      ExecutionContext.logger.info(
        `Entity Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Entity_Delete',
          durationMs: duration,
          success: false,

          error: JSON.stringify(error),
          dto: JSON.stringify(this.request.query),
        }
      );

      throw error;
    }
  }
}

export { DeleteEntityController };
