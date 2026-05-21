import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { RestorePageDraftUseCaseFactory } from '../factories/RestorePageDraftUseCaseFactory.js';
import { RestorePageDraftSchema, RestorePageDraftRequest } from './Schemas.js';

class RestorePageDraftController extends AbstractController<RestorePageDraftRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    const parsed = RestorePageDraftSchema.parse(this.request.body);

    try {
      const output = await RestorePageDraftUseCaseFactory.default().execute({
        ...parsed,
        language: this.language,
      });

      ExecutionContext.logger.info('Page draft restored from release', {
        namespace: 'Page_Restore',
        success: true,
        durationMs: Date.now() - startTime,
        sharedId: parsed.sharedId,
        version: parsed.version,
      });

      this.response.json(output);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Page restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Page_Restore',
          success: false,
          durationMs: Date.now() - startTime,
          sharedId: parsed.sharedId,
        }
      );
      throw error;
    }
  }
}

export { RestorePageDraftController };
