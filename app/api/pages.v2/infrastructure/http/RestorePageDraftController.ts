import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { RestorePageDraftUseCaseFactory } from '../factories/RestorePageDraftUseCaseFactory.js';
import { RestorePageDraftSchema, RestorePageDraftRequest } from './Schemas.js';
import { mapPageHttpErrors } from './mapPageHttpErrors.js';

class RestorePageDraftController extends AbstractController<RestorePageDraftRequest> {
  protected async handle(): Promise<void> {
    const parsed = RestorePageDraftSchema.parse(this.request.body);

    try {
      const output = await RestorePageDraftUseCaseFactory.default().execute({
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

export { RestorePageDraftController };
