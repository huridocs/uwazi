import { RestorePageDraftSchema } from '#shared/contracts/Pages.js';
import type { RestorePageDraftRequest, RestorePageDraftResponse } from '#shared/contracts/Pages.js';
import { RestorePageDraftUseCaseFactory } from '../factories/RestorePageDraftUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class RestorePageDraftController extends AbstractPagesController<RestorePageDraftRequest> {
  protected async perform(): Promise<void> {
    const parsed = RestorePageDraftSchema.parse(this.request.body);

    const response: RestorePageDraftResponse =
      await RestorePageDraftUseCaseFactory.default().execute({
        ...parsed,
        language: this.language,
      });

    this.response.json(response);
  }
}

export { RestorePageDraftController };
