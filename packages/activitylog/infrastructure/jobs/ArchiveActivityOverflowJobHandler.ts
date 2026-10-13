import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { ArchiveActivityOverflow } from '../../application/ArchiveActivityOverflow.js';
import { ArchiveActivityOverflowFactory } from '../factories/ArchiveActivityOverflowFactory.js';

type Deps = {
  archiveOverflow: ArchiveActivityOverflow;
};

/** Archives the overflow of the tenant whose namespace it was dispatched into. */
@PrivilegedJob()
class ArchiveActivityOverflowJobHandler extends UwaziJobHandler {
  constructor(private deps: Deps) {
    super();
  }

  /** Built inside the tenant's context, which is where the queue worker creates its handlers. */
  static default(): ArchiveActivityOverflowJobHandler {
    return new ArchiveActivityOverflowJobHandler({
      archiveOverflow: ArchiveActivityOverflowFactory.default(),
    });
  }

  protected async handle() {
    await this.deps.archiveOverflow.execute();
  }
}

export { ArchiveActivityOverflowJobHandler };
