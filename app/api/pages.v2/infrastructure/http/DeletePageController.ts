import { DeletePageSchema } from '#shared/contracts/Pages.js';
import type { DeletePageResponse } from '#shared/contracts/Pages.js';
import { DeletePageUseCaseFactory } from '../factories/DeletePageUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class DeletePageController extends AbstractPagesController {
  protected async perform(): Promise<void> {
    const { sharedId } = DeletePageSchema.parse(this.request.query);

    const response: DeletePageResponse = await DeletePageUseCaseFactory.default().execute({
      sharedId: sharedId!,
    });
    this.response.json(response);
  }
}

export { DeletePageController };
