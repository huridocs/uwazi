import { PageType } from '#shared/types/pageType.js';
import { SavePageUseCaseFactory } from '../factories/SavePageUseCaseFactory.js';
import { AbstractPagesController } from './AbstractPagesController.js';

class SavePageController extends AbstractPagesController<PageType> {
  protected async perform(): Promise<void> {
    const page = this.request.body;
    const editorResponse = !!page.locales && Object.keys(page.locales).length > 0;

    const output = await SavePageUseCaseFactory.default().execute({
      page,
      user: this.request.user,
      language: this.language,
      editorResponse,
    });
    this.response.json(output);
  }
}

export { SavePageController };
