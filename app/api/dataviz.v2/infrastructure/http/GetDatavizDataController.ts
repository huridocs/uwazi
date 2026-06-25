import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class GetDatavizDataController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.getDataUseCase();
    const data = await useCase.execute({ id: this.request.params.id! });
    this.response.json(data);
  }
}

export { GetDatavizDataController };
