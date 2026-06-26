import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import { CreateDatavizUseCase } from '#api/dataviz.v2/application/useCases/CreateDataviz.js';

class CreateDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.createUseCase();
    const input = CreateDatavizUseCase.inputSchema.parse(this.request.body);
    const dataviz = await useCase.execute(input);
    this.response.json(dataviz.toDefinition());
  }
}

export { CreateDatavizController };
