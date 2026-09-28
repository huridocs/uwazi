import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';
import { SegmentationScheduler } from './SegmentationScheduler.js';

type Input = {
  batchSize: number;
  heartbeat: HeartbeatCallback;
};

type Deps = {
  segmentationDS: SegmentationDataSource;
  settingsDS: SettingsDataSource;
  scheduler: SegmentationScheduler;
};

/**
 * Requests every idle segmentation of the tenant, when segmentation is on: what files gathered
 * while it was off. Each batch is scheduled in its own transaction, so a large backlog is never
 * one transaction, and a batch that fails leaves the rest idle for the next run.
 */
type Output = {
  segmentationEnabled: boolean;
  requested: number;
};

class QueueIdleSegmentations extends AbstractUseCase<Input, Output, Deps> {
  async execute({ batchSize, heartbeat }: Input): Promise<Output> {
    if (!(await this.deps.settingsDS.readFeature('segmentation'))) {
      return { segmentationEnabled: false, requested: 0 };
    }
    return { segmentationEnabled: true, requested: await this.drain(batchSize, heartbeat) };
  }

  private async drain(
    batchSize: number,
    heartbeat: HeartbeatCallback,
    afterId?: string
  ): Promise<number> {
    const batch = await this.deps.segmentationDS.nextIdleBatch(batchSize, afterId);
    if (!batch.length) {
      return 0;
    }

    const requested = await this.transactionManager.run(async () =>
      this.deps.scheduler.schedule(batch)
    );
    await heartbeat();
    return requested + (await this.drain(batchSize, heartbeat, batch[batch.length - 1].id));
  }
}

export { QueueIdleSegmentations };
export type { Output as QueueIdleSegmentationsOutput };
