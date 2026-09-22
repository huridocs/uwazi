import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { tenants } from '#api/tenants/index.js';
import { AcceptSuggestionsUseCase } from '../application/AcceptSuggestionsUseCase.js';
import { AcceptSuggestionsJob } from '../jobs/AcceptSuggestionsJob.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Props = { tenantName?: string; batchSize?: number };

export class AcceptSuggestionsFactory {
  static async createDefault({ tenantName, batchSize = 50 }: Props) {
    const tName = tenantName || tenants.current().name;
    const dispatcher: JobsDispatcher = ExecutionContext.jobsDispatcher;
    const useCase = new AcceptSuggestionsUseCase();
    const job = new AcceptSuggestionsJob({ tenantName: tName, useCase, dispatcher, batchSize });
    return { useCase, dispatcher, job };
  }
}
