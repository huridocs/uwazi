import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { tenants } from 'api/tenants';
import { AcceptSuggestionsUseCase } from '../application/AcceptSuggestionsUseCase';
import { AcceptSuggestionsJob } from '../jobs/AcceptSuggestionsJob';

type Props = { tenantName?: string; batchSize?: number };

export class AcceptSuggestionsFactory {
  static async createDefault({ tenantName, batchSize = 50 }: Props) {
    const tName = tenantName || tenants.current().name;
    const dispatcher: JobsDispatcher = await DefaultDispatcher(tName, {
      lockWindow: 1000 * 60 * 10,
    });
    const useCase = new AcceptSuggestionsUseCase();
    const job = new AcceptSuggestionsJob({ tenantName: tName, useCase, dispatcher, batchSize });
    return { useCase, dispatcher, job };
  }
}
