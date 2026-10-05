import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { OcrJobs } from '../../application/contracts/OcrJobs.js';
// eslint-disable-next-line import/no-cycle
import { SubmitOcrJobHandler } from './SubmitOcrJobHandler.js';

class OcrJobsAdapter implements OcrJobs {
  constructor(private readonly deps: { jobsDispatcher: JobsDispatcher }) {}

  async submitOcr(recordId: string, { delayMs }: { delayMs?: number } = {}): Promise<void> {
    const options = delayMs ? { lockedUntil: Date.now() + delayMs } : undefined;
    await this.deps.jobsDispatcher.dispatch(SubmitOcrJobHandler, { recordId }, options);
  }
}

export { OcrJobsAdapter };
