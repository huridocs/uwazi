import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class GetDatavizDefinitionController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.getDefinitionUseCase();
    const dataviz = await useCase.execute({ id: this.request.params.id! });
    this.response.json(dataviz.toDefinition());
  }
}

export { GetDatavizDefinitionController };
