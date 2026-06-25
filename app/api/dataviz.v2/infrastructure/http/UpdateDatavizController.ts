import { DatavizController } from './DatavizController.js';
import { UpdateDatavizUseCase } from '#api/dataviz.v2/application/useCases/UpdateDataviz.js';
import { UpdateDatavizUseCaseFactory } from '../factories/UpdateDatavizUseCaseFactory.js';

class UpdateDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = UpdateDatavizUseCaseFactory.default();
    const input = UpdateDatavizUseCase.inputSchema.parse({
      ...this.request.body,
      id: this.request.params.id!,
    });
    const dataviz = await useCase.execute(input);
    this.response.json(dataviz.toDefinition());
  }
}

export { UpdateDatavizController };
