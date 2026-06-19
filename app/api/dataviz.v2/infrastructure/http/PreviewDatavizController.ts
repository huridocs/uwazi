import { DatavizController } from './DatavizController.js';
import type { DatavizQuery } from '#shared/types/datavizSchema.js';
import { GetDatavizDataUseCaseFactory } from '../factories/GetDatavizDataUseCaseFactory.js';

type PreviewBody = {
  query?: DatavizQuery;
};

class PreviewDatavizController extends DatavizController<PreviewBody> {
  protected async handle(): Promise<void> {
    const useCase = GetDatavizDataUseCaseFactory.default();
    const data = await useCase.execute({
      id: this.request.params.id!,
      draftQuery: this.request.body?.query,
    });
    this.response.json(data);
  }
}

export { PreviewDatavizController };
