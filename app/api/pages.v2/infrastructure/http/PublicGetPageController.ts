import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GetPublicPageUseCaseFactory } from '../factories/GetPublicPageUseCaseFactory.js';
import { mapPageHttpErrors } from './mapPageHttpErrors.js';

class PublicGetPageController extends AbstractController {
  protected async handle(): Promise<void> {
    const sharedId = this.request.query.sharedId as string | undefined;
    if (!sharedId) {
      this.response.status(400).json({ message: 'sharedId is required' });
      return;
    }

    try {
      const useCase = GetPublicPageUseCaseFactory.default(this.language);
      const page = await useCase.execute({ sharedId, language: this.language });
      this.response.json(page);
    } catch (error: unknown) {
      if (mapPageHttpErrors(error, this.response)) {
        return;
      }
      throw error;
    }
  }
}

export { PublicGetPageController };
