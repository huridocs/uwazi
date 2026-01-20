import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import {
  BulkDeleteEntityInput,
  BulkDeleteEntityUseCase,
} from '#api/core/application/BulkDeleteEntity.js';
import { tenants } from '#api/tenants/index.js';
import entities from '#api/entities/index.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { BulkDeleteEntityUseCaseFactory } from '#api/core/infrastructure/factories/BulkDeleteEntityUseCaseFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

type RequestDto = BulkDeleteEntityInput;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ResponseDto = string;

class BulkDeleteEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    if (tenants.current()?.featureFlags?.v2BulkDeleteEntity) {
      const logger = LoggerFactory.default();
      const useCase = BulkDeleteEntityUseCaseFactory.default();

      try {
        const startTime = Date.now();
        const parsed = BulkDeleteEntityUseCase.InputSchema.parse({
          sharedIds: ArrayUtils.deduplicate(this.request?.body?.sharedIds || [], s => s),
        });

        await useCase.execute(parsed);

        logger.info('Bulk delete executed successfully', {
          namespace: 'Bulk_Delete_Entity',
          success: true,

          deletedCount: this.request.body.sharedIds.length,
          durationMs: Date.now() - startTime,
        });
        this.response.json('ok');
        return;
      } catch (error: unknown) {
        logger.info(
          `Bulk delete execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            namespace: 'Bulk_Delete_Entity',
            success: false,

            dto: JSON.stringify(this.request?.body || {}),
            error: JSON.stringify(error),
          }
        );

        throw error;
      }
    }

    await entities.deleteMultiple(this.request.body?.sharedIds);

    this.response.json('ok');
  }
}

export { BulkDeleteEntityController };
export type { RequestDto as BulkDeleteEntityRequestDto };
