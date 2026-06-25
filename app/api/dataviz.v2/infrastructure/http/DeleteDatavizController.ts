import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class DeleteDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.deleteUseCase();
    const result = await useCase.execute({ id: this.request.params.id! });
    this.response.json(result);
  }
}

export { DeleteDatavizController };
