import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';

class RefreshDatavizSnapshotController extends DatavizController {
  protected async handle(): Promise<void> {
    const job = DatavizFactory.refreshSnapshotJob();
    const data = await job.execute({ datavizId: this.request.params.id! });
    this.response.json(data);
  }
}

export { RefreshDatavizSnapshotController };
