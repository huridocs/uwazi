import { ListPagesSchema } from '#shared/contracts/Pages.js';
import type { ListPagesResponse } from '#shared/contracts/Pages.js';
import { ListPagesUseCaseFactory } from '../factories/ListPagesUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class ListPagesController extends AbstractPagesController {
  protected async perform(): Promise<void> {
    const { sharedId } = ListPagesSchema.parse(this.request.query);

    const response: ListPagesResponse = await ListPagesUseCaseFactory.default().execute({
      sharedId,
      language: this.language,
    });
    this.response.json(response);
  }
}

export { ListPagesController };
