import { DatavizController } from './DatavizController.js';
import { GetDatavizDataUseCaseFactory } from '../factories/GetDatavizDataUseCaseFactory.js';

class GetDatavizDataController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = GetDatavizDataUseCaseFactory.default();
    const data = await useCase.execute({ id: this.request.params.id! });
    this.response.json(data);
  }
}

export { GetDatavizDataController };
