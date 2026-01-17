import { DefaultDispatcher } from '#api/queue.v2/configuration/factories.js';

import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

import { tenants } from '#api/tenants/index.js';
import { AcceptSuggestionsUseCase } from '#api/suggestions/application/AcceptSuggestionsUseCase';
import { AcceptSuggestionsJob } from '#api/suggestions/jobs/AcceptSuggestionsJob';

type Props = { tenantName?: string; batchSize?: number };

export class AcceptSuggestionsFactory {
  static async createDefault({ tenantName, batchSize = 50 }: Props) {
    const tName = tenantName || tenants.current().name;
    const dispatcher: JobsDispatcher = DefaultDispatcher(
      tName,
      TransactionManagerFactory.default(),
      {
        lockWindow: 1000 * 60 * 10,
      }
    );
    const useCase = new AcceptSuggestionsUseCase();
    const job = new AcceptSuggestionsJob({ tenantName: tName, useCase, dispatcher, batchSize });
    return { useCase, dispatcher, job };
  }
}
