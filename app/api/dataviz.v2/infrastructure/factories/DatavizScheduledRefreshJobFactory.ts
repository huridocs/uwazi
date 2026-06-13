import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizScheduledRefreshJob } from '../jobs/DatavizScheduledRefreshJob.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { RefreshDatavizSnapshotUseCaseFactory } from './RefreshDatavizSnapshotUseCaseFactory.js';

class DatavizScheduledRefreshJobFactory {
  static default(_namespace: string) {
    return new DatavizScheduledRefreshJob({
      refreshUseCase: RefreshDatavizSnapshotUseCaseFactory.default(),
      datavizDS: DatavizDataSourceFactory.default(),
      jobsDispatcher: ExecutionContext.jobsDispatcher,
    });
  }
}

export { DatavizScheduledRefreshJobFactory };
