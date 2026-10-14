import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { ArchiveActivityOverflowFactory } from '../factories/ArchiveActivityOverflowFactory.js';

/** Archives the overflow of the tenant whose namespace it was dispatched into. */
@PrivilegedJob()
class ArchiveActivityOverflowJobHandler extends UwaziJobHandler {
  // eslint-disable-next-line class-methods-use-this
  protected async handle() {
    await ArchiveActivityOverflowFactory.default().execute();
  }
}

export { ArchiveActivityOverflowJobHandler };
