import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PublishPageReleaseUseCaseFactory } from '../factories/PublishPageReleaseUseCaseFactory.js';
import { PublishPageReleaseSchema, PublishPageReleaseRequest } from './Schemas.js';

class PublishPageReleaseController extends AbstractController<PublishPageReleaseRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    const parsed = PublishPageReleaseSchema.parse(this.request.body);

    try {
      const output = await PublishPageReleaseUseCaseFactory.default().execute({
        ...parsed,
        language: this.language,
      });

      ExecutionContext.logger.info('Page release published', {
        namespace: 'Page_Release',
        success: true,
        durationMs: Date.now() - startTime,
        sharedId: parsed.sharedId,
        version: output.version,
      });

      this.response.json(output);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Page release failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Page_Release',
          success: false,
          durationMs: Date.now() - startTime,
          sharedId: parsed.sharedId,
        }
      );
      throw error;
    }
  }
}

export { PublishPageReleaseController };
