import { DatavizController } from './DatavizController.js';
import { DeleteDatavizUseCaseFactory } from '../factories/DeleteDatavizUseCaseFactory.js';

class DeleteDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DeleteDatavizUseCaseFactory.default();
    const result = await useCase.execute({ id: this.request.params.id! });
    this.response.json(result);
  }
}

export { DeleteDatavizController };
