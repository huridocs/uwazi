import { DatavizController } from './DatavizController.js';
import { RefreshDatavizSnapshotUseCaseFactory } from '../factories/RefreshDatavizSnapshotUseCaseFactory.js';

class RefreshDatavizSnapshotController extends DatavizController {
  protected async handle(): Promise<void> {
    const useCase = RefreshDatavizSnapshotUseCaseFactory.default({
      targetLanguage: this.language,
    });
    const data = await useCase.execute({ datavizId: this.request.params.id! });
    this.response.json(data);
  }
}

export { RefreshDatavizSnapshotController };
