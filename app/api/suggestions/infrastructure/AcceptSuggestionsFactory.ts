// @ts-expect-error TS(2307): Cannot find module '../queue.v2/configuration/fact... Remove this comment to see the full error message
import { DefaultDispatcher } from '../queue.v2/configuration/factories.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
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
