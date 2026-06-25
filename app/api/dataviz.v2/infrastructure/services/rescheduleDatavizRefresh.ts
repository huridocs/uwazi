import type { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { DatavizScheduledRefreshJobHandlerToken } from '#api/dataviz.v2/application/contracts/DatavizScheduledRefreshJobHandlerToken.js';
import type { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { computeNextLockedUntil } from '#shared/dataviz/computeNextLockedUntil.js';

type RescheduleParams = {
  datavizId: string;
  tenantName: string;
  userId: string;
  datavizDS: DatavizDataSource;
  jobsDispatcher: JobsDispatcher;
};

const rescheduleDatavizRefresh = async ({
  datavizId,
  tenantName,
  userId,
  datavizDS,
  jobsDispatcher,
}: RescheduleParams): Promise<void> => {
  const datavizResult = await datavizDS.getById(datavizId);
  if (datavizResult.isError()) {
    return;
  }

  const dataviz = datavizResult.getDataOrThrow();
  if (!dataviz.isScheduled) {
    return;
  }

  const lockedUntil = computeNextLockedUntil(dataviz.refresh);
  await jobsDispatcher.dispatch(
    DatavizScheduledRefreshJobHandlerToken,
    { datavizId, tenantName, userId },
    { lockedUntil }
  );
};

export { rescheduleDatavizRefresh };
