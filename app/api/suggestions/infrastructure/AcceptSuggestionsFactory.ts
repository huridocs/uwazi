import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { AcceptSuggestionsUseCase } from '../application/AcceptSuggestionsUseCase.js';
import { AcceptSuggestionsJob } from '../jobs/AcceptSuggestionsJob.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Props = { batchSize?: number };

export class AcceptSuggestionsFactory {
  static async createDefault({ batchSize = 50 }: Props = {}) {
    const dispatcher: JobsDispatcher = ExecutionContext.jobsDispatcher;
    const useCase = new AcceptSuggestionsUseCase();
    const job = new AcceptSuggestionsJob({ useCase, dispatcher, batchSize });
    return { useCase, dispatcher, job };
  }
}
