import { DeletePageUseCaseFactory } from '../factories/DeletePageUseCaseFactory.js';
import { DeletePageSchema } from './Schemas.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class DeletePageController extends AbstractPagesController {
  protected async perform(): Promise<void> {
    const { sharedId } = DeletePageSchema.parse(this.request.query);

    const output = await DeletePageUseCaseFactory.default().execute({ sharedId: sharedId! });
    this.response.json(output);
  }
}

export { DeletePageController };
