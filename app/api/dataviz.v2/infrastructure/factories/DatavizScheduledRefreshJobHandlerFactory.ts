import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizScheduledRefreshJobHandler } from '../jobHandlers/DatavizScheduledRefreshJobHandler.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { RefreshDatavizSnapshotJobFactory } from './RefreshDatavizSnapshotJobFactory.js';

class DatavizScheduledRefreshJobHandlerFactory {
  static default(_namespace: string) {
    return new DatavizScheduledRefreshJobHandler({
      job: RefreshDatavizSnapshotJobFactory.default(),
      datavizDS: DatavizDataSourceFactory.default(),
      jobsDispatcher: ExecutionContext.jobsDispatcher,
    });
  }
}

export { DatavizScheduledRefreshJobHandlerFactory };
