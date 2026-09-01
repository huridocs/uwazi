import { RestorePageDraftUseCaseFactory } from '../factories/RestorePageDraftUseCaseFactory.js';
import { RestorePageDraftSchema, RestorePageDraftRequest } from './Schemas.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class RestorePageDraftController extends AbstractPagesController<RestorePageDraftRequest> {
  protected async perform(): Promise<void> {
    const parsed = RestorePageDraftSchema.parse(this.request.body);

    const output = await RestorePageDraftUseCaseFactory.default().execute({
      ...parsed,
      language: this.language,
    });

    this.response.json(output);
  }
}

export { RestorePageDraftController };
