import { PublishPageReleaseSchema } from '#shared/contracts/Pages.js';
import type {
  PublishPageReleaseRequest,
  PublishPageReleaseResponse,
} from '#shared/contracts/Pages.js';
import { PublishPageReleaseUseCaseFactory } from '../factories/PublishPageReleaseUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class PublishPageReleaseController extends AbstractPagesController<PublishPageReleaseRequest> {
  protected async perform(): Promise<void> {
    const parsed = PublishPageReleaseSchema.parse(this.request.body);

    const response: PublishPageReleaseResponse =
      await PublishPageReleaseUseCaseFactory.default().execute({
        ...parsed,
        language: this.language,
      });

    this.response.json(response);
  }
}

export { PublishPageReleaseController };
