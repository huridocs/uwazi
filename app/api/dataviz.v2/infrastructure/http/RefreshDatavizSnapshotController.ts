import { DatavizController } from './DatavizController.js';
import { RefreshDatavizSnapshotJobFactory } from '../factories/RefreshDatavizSnapshotJobFactory.js';

class RefreshDatavizSnapshotController extends DatavizController {
  protected async handle(): Promise<void> {
    const job = RefreshDatavizSnapshotJobFactory.default();
    const data = await job.execute({ datavizId: this.request.params.id! });
    this.response.json(data);
  }
}

export { RefreshDatavizSnapshotController };
