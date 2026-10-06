import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { OcrOutcome } from '../../application/contracts/OcrEngine.js';
import { OcrJobs } from '../../application/contracts/OcrJobs.js';
// eslint-disable-next-line import/no-cycle
import { OcrOutcomeParams } from './OcrOutcomeParams.js';
// eslint-disable-next-line import/no-cycle
import { SaveOcrResultJobHandler } from './SaveOcrResultJobHandler.js';
// eslint-disable-next-line import/no-cycle
import { SubmitOcrJobHandler } from './SubmitOcrJobHandler.js';

class OcrJobsAdapter implements OcrJobs {
  constructor(private readonly deps: { jobsDispatcher: JobsDispatcher }) {}

  async submitOcr(recordId: string, { delayMs }: { delayMs?: number } = {}): Promise<void> {
    const options = delayMs ? { lockedUntil: Date.now() + delayMs } : undefined;
    await this.deps.jobsDispatcher.dispatch(SubmitOcrJobHandler, { recordId }, options);
  }

  /** Used by the result listener, which is outside the application layer. */
  async saveResult(outcome: OcrOutcome): Promise<void> {
    await this.deps.jobsDispatcher.dispatch(
      SaveOcrResultJobHandler,
      OcrOutcomeParams.from(outcome)
    );
  }
}

export { OcrJobsAdapter };
