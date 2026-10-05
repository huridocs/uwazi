import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
// eslint-disable-next-line import/no-cycle
import { FailStaleOcrRecordsFactory } from '../factories/FailStaleOcrRecordsFactory.js';

@PrivilegedJob()
class FailStaleOcrRecordsJobHandler extends UwaziJobHandler<UwaziJobParams> {
  // eslint-disable-next-line class-methods-use-this
  protected async handle(_heartbeat: HeartbeatCallback) {
    await FailStaleOcrRecordsFactory.default().execute();
  }
}

export { FailStaleOcrRecordsJobHandler };
