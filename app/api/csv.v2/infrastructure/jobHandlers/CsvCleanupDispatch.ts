import { JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';

type CleanupAwareUseCase = {
  shouldDispatchCleanupOnCancelled(importId: string): Promise<boolean>;
  shouldDispatchCleanupOnFailed(importId: string): Promise<boolean>;
  dispatchFilesCleanup(importId: string, userId: string): Promise<void>;
  markAsFailed(importId: string): Promise<void>;
};

const dispatchCleanupAfterCancelledStage = async (params: {
  useCase: CleanupAwareUseCase;
  importId: string;
  userId: string;
}) => {
  const { useCase, importId, userId } = params;
  if (!(await useCase.shouldDispatchCleanupOnCancelled(importId))) {
    return;
  }
  await useCase.dispatchFilesCleanup(importId, userId);
};

const handleTerminalFailureCleanup = async (params: {
  useCase: CleanupAwareUseCase;
  importId: string;
  userId: string;
  error: unknown;
  jobInfo?: JobInfo;
}) => {
  const { useCase, importId, userId, error, jobInfo } = params;
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
  await useCase.dispatchFilesCleanup(importId, userId);
};

export { dispatchCleanupAfterCancelledStage, handleTerminalFailureCleanup };
