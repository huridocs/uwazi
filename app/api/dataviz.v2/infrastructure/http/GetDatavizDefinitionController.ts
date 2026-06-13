import { DatavizController } from './DatavizController.js';
import { GetDatavizDefinitionUseCaseFactory } from '../factories/GetDatavizDefinitionUseCaseFactory.js';

class GetDatavizDefinitionController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = GetDatavizDefinitionUseCaseFactory.default();
    const dataviz = await useCase.execute({ id: this.request.params.id! });
    this.response.json(dataviz.toDefinition());
  }
}

export { GetDatavizDefinitionController };
