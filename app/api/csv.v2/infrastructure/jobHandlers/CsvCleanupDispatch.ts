import { JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';

type CleanupAwareUseCase = {
  shouldDispatchCleanupOnCancelled(importId: string): Promise<boolean>;
  shouldDispatchCleanupOnFailed(importId: string): Promise<boolean>;
  dispatchFilesCleanup(importId: string, tenantName: string, userId: string): Promise<void>;
  markAsFailed(importId: string): Promise<void>;
};

const dispatchCleanupAfterCancelledStage = async (params: {
  useCase: CleanupAwareUseCase;
  importId: string;
  tenantName: string;
  userId: string;
}) => {
  const { useCase, importId, tenantName, userId } = params;
  if (!(await useCase.shouldDispatchCleanupOnCancelled(importId))) {
    return;
  }
  await useCase.dispatchFilesCleanup(importId, tenantName, userId);
};

const handleTerminalFailureCleanup = async (params: {
  useCase: CleanupAwareUseCase;
  importId: string;
  tenantName: string;
  userId: string;
  error: unknown;
  jobInfo?: JobInfo;
}) => {
  const { useCase, importId, tenantName, userId, error, jobInfo } = params;
  const isLastRetry = Boolean(jobInfo && jobInfo.retryCount + 1 >= jobInfo.maxRetries);
  if (isLastRetry) {
    await useCase.markAsFailed(importId);
  }

  const terminalFailure = error instanceof NonRetryableJobError || isLastRetry;
  if (!terminalFailure) {
    return;
  }
  if (!(await useCase.shouldDispatchCleanupOnFailed(importId))) {
    return;
  }
  await useCase.dispatchFilesCleanup(importId, tenantName, userId);
};

export { dispatchCleanupAfterCancelledStage, handleTerminalFailureCleanup };
