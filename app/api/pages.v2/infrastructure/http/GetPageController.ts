import { GetPageUseCaseFactory } from '../factories/GetPageUseCaseFactory.js';
import { GetPageSchema } from './Schemas.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class GetPageController extends AbstractPagesController {
  protected async perform(): Promise<void> {
    const { sharedId, mode } = GetPageSchema.parse(this.request.query);

    const output = await GetPageUseCaseFactory.default().execute({
      lookup: { sharedId },
      language: this.language,
      mode,
    });
    this.response.json(output);
  }
}

export { GetPageController };
