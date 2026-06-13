import { DatavizController } from './DatavizController.js';
import { GetPublicDatavizEmbedUseCaseFactory } from '../factories/GetPublicDatavizEmbedUseCaseFactory.js';

class PublicGetDatavizEmbedController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = GetPublicDatavizEmbedUseCaseFactory.default({ targetLanguage: this.language });
    const payload = await useCase.execute({ id: this.request.params.id! });
    this.response.json(payload);
  }
}

export { PublicGetDatavizEmbedController };
