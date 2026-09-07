import type {
  CreatePageRequest,
  UpdatePageRequest,
  SavePageResponse,
} from '#shared/contracts/Pages.js';
import { CreatePageUseCaseFactory } from '../factories/CreatePageUseCaseFactory.js';
import { UpdatePageUseCaseFactory } from '../factories/UpdatePageUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class SavePageController extends AbstractPagesController<CreatePageRequest | UpdatePageRequest> {
  protected async perform(): Promise<void> {
    const page = this.request.body;
    const editorResponse = !!page.locales && Object.keys(page.locales).length > 0;

    const response: SavePageResponse = page.sharedId
      ? await UpdatePageUseCaseFactory.default().execute({
          page: { ...page, sharedId: page.sharedId },
          language: this.language,
          editorResponse,
        })
      : await CreatePageUseCaseFactory.default().execute({
          page,
          language: this.language,
          editorResponse,
        });
    this.response.json(response);
  }
}

export { SavePageController };
