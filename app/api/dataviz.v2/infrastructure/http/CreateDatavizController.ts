import { DatavizController } from './DatavizController.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import { CreateDatavizUseCaseFactory } from '../factories/CreateDatavizUseCaseFactory.js';

class CreateDatavizController extends DatavizController<DatavizDefinition> {
  protected async handle(): Promise<void> {
    const useCase = CreateDatavizUseCaseFactory.default();
    const dataviz = await useCase.execute(this.request.body);
    this.response.json(dataviz.toDefinition());
  }
}

export { CreateDatavizController };
