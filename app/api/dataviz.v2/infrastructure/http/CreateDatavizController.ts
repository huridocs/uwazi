import { DatavizController } from './DatavizController.js';
import { CreateDatavizUseCase } from '#api/dataviz.v2/application/useCases/CreateDataviz.js';
import { CreateDatavizUseCaseFactory } from '../factories/CreateDatavizUseCaseFactory.js';

class CreateDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = CreateDatavizUseCaseFactory.default();
    const input = CreateDatavizUseCase.inputSchema.parse(this.request.body);
    const dataviz = await useCase.execute(input);
    this.response.json(dataviz.toDefinition());
  }
}

export { CreateDatavizController };
