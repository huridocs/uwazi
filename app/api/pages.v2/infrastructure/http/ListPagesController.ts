import { ListPagesUseCaseFactory } from '../factories/ListPagesUseCaseFactory.js';
import { ListPagesSchema } from './Schemas.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class ListPagesController extends AbstractPagesController {
  protected async perform(): Promise<void> {
    const { sharedId } = ListPagesSchema.parse(this.request.query);

    const output = await ListPagesUseCaseFactory.default().execute({
      sharedId,
      language: this.language,
    });
    this.response.json(output);
  }
}

export { ListPagesController };
