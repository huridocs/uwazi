import { DatavizController } from './DatavizController.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { UpdateDatavizUseCaseFactory } from '../factories/UpdateDatavizUseCaseFactory.js';

class UpdateDatavizController extends DatavizController<DatavizDefinition> {
  protected async handle(): Promise<void> {
    const useCase = UpdateDatavizUseCaseFactory.default();
    const dataviz = await useCase.execute({
      ...this.request.body,
      id: this.request.params.id!,
    });
    this.response.json(dataviz.toDefinition());
  }
}

export { UpdateDatavizController };
