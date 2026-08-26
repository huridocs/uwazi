import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { PublishPageReleaseUseCaseFactory } from '../factories/PublishPageReleaseUseCaseFactory.js';
import { PublishPageReleaseSchema, PublishPageReleaseRequest } from './Schemas.js';
import { mapPageHttpErrors } from './mapPageHttpErrors.js';

class PublishPageReleaseController extends AbstractController<PublishPageReleaseRequest> {
  protected async handle(): Promise<void> {
    const parsed = PublishPageReleaseSchema.parse(this.request.body);

    try {
      const output = await PublishPageReleaseUseCaseFactory.default().execute({
        ...parsed,
        language: this.language,
      });

      this.response.json(output);
    } catch (error: unknown) {
      if (mapPageHttpErrors(error, this.response)) {
        return;
      }
      throw error;
    }
  }
}

export { PublishPageReleaseController };
