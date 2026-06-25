import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class ListDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = DatavizFactory.listUseCase();
    const rows = await useCase.execute();
    this.response.json({ rows: rows.map(r => r.toDefinition()) });
  }
}

export { ListDatavizController };
