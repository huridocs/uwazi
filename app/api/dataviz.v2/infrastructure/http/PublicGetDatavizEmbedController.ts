import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class PublicGetDatavizEmbedController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.getPublicEmbedUseCase({ targetLanguage: this.language });
    const payload = await useCase.execute({ id: this.request.params.id! });
    this.response.json(payload);
  }
}

export { PublicGetDatavizEmbedController };
