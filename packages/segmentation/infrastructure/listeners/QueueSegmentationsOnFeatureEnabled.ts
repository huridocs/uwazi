import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { QueueIdleSegmentations } from '../../application/QueueIdleSegmentations.js';

const BATCH_SIZE = 200;

type Deps = {
  queueIdleSegmentations: QueueIdleSegmentations;
};

/** When segmentation is switched on, requests what gathered while it was off. */
@PrivilegedJob()
class QueueSegmentationsOnFeatureEnabled extends Listener<SettingsChangedEvent, Deps> {
  static eventName = SettingsChangedEvent.name;

  async handle(heartbeat: HeartbeatCallback, { changes }: SettingsChangedEvent['payload']) {
    if (!changes.features?.enabled.includes('segmentation')) {
      return;
    }
    await this.deps.queueIdleSegmentations.execute({ batchSize: BATCH_SIZE, heartbeat });
  }
}

EventEmitterFactory.registry.register(QueueSegmentationsOnFeatureEnabled);

export { QueueSegmentationsOnFeatureEnabled };
