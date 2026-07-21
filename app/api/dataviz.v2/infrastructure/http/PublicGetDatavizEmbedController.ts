import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class PublicGetDatavizEmbedController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.getPublicEmbedUseCase({ targetLanguage: this.language });
    const externalFiltersParam = this.request.query.externalFilters;

    let externalFilters;
    if (typeof externalFiltersParam === 'string') {
      try {
        externalFilters = JSON.parse(externalFiltersParam);
      } catch {
        this.response.status(400).json({ error: 'Invalid externalFilters JSON' });
        return;
      }
    }

    const payload = await useCase.execute({
      id: this.request.params.id!,
      externalFilters,
    });
    this.response.json(payload);
  }
}

export { PublicGetDatavizEmbedController };
