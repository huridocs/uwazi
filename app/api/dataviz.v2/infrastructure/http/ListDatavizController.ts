import { DatavizController } from './DatavizController.js';
import { ListDatavizUseCaseFactory } from '../factories/ListDatavizUseCaseFactory.js';

class ListDatavizController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = ListDatavizUseCaseFactory.default();
    const rows = await useCase.execute();
    this.response.json({ rows: rows.map(r => r.toDefinition()) });
  }
}

export { ListDatavizController };
