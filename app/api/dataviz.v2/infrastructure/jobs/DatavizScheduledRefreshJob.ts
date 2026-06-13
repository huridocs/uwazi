import type { RefreshDatavizSnapshotUseCase } from '#api/dataviz.v2/application/useCases/RefreshDatavizSnapshot.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { rescheduleDatavizRefresh } from '../services/rescheduleDatavizRefresh.js';

type Params = {
  datavizId: string;
} & UserAwareDispatchableParams;

type JobDependencies = {
  refreshUseCase: RefreshDatavizSnapshotUseCase;
  datavizDS: DatavizDataSource;
  jobsDispatcher: JobsDispatcher;
};

class DatavizScheduledRefreshJob extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  private async rescheduleIfNeeded() {
    await rescheduleDatavizRefresh({
      datavizId: this.params.datavizId,
      tenantName: this.tenantName,
      userId: this.userId,
      datavizDS: this.deps.datavizDS,
      jobsDispatcher: this.deps.jobsDispatcher,
    });
  }

  protected async handle() {
    try {
      await this.deps.refreshUseCase.execute({ datavizId: this.params.datavizId });
    } finally {
      await this.rescheduleIfNeeded();
    }
  }
}

export { DatavizScheduledRefreshJob };
