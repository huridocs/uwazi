import { GetPageSchema } from '#shared/contracts/Pages.js';
import type { GetPageResponse } from '#shared/contracts/Pages.js';
import { GetPageUseCaseFactory } from '../factories/GetPageUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class GetPageController extends AbstractPagesController {
  protected async perform(): Promise<void> {
    const { sharedId, mode } = GetPageSchema.parse(this.request.query);

    const response: GetPageResponse = await GetPageUseCaseFactory.default().execute({
      lookup: { sharedId },
      language: this.language,
      mode,
    });
    this.response.json(response);
  }
}

export { GetPageController };
