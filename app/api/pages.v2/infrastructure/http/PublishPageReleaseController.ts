import { PublishPageReleaseUseCaseFactory } from '../factories/PublishPageReleaseUseCaseFactory.js';
import { PublishPageReleaseSchema, PublishPageReleaseRequest } from './Schemas.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class PublishPageReleaseController extends AbstractPagesController<PublishPageReleaseRequest> {
  protected async perform(): Promise<void> {
    const parsed = PublishPageReleaseSchema.parse(this.request.body);

    const output = await PublishPageReleaseUseCaseFactory.default().execute({
      ...parsed,
      language: this.language,
    });

    this.response.json(output);
  }
}

export { PublishPageReleaseController };
