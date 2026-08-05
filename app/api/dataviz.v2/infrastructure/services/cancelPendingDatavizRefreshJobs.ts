import type { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { datavizScheduledRefreshJobTokens } from '#api/dataviz.v2/application/contracts/DatavizScheduledRefreshJobHandlerToken.js';

const cancelPendingDatavizRefreshJobs = async (
  jobsDispatcher: JobsDispatcher,
  datavizId: string
): Promise<void> => {
  await Promise.all(
    datavizScheduledRefreshJobTokens.map(async token =>
      jobsDispatcher.cancelByParams(token, { datavizId })
    )
  );
};

export { cancelPendingDatavizRefreshJobs };
