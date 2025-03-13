import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { tenants } from 'api/tenants';
import { permissionsContext } from 'api/permissions/permissionsContext';

import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';

type Params = { tenantName: string } & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(_: HeartbeatCallback, params: Params) {
    await tenants.run(async () => {
      permissionsContext.setCommandContext();

      const useCase = PXExtractParagraphsFromEntityFactory.createDefault(params.tenantName);

      await useCase.execute(params);
    }, params.tenantName);
  }
}

export { PXExtractParagraphsFromEntityJob };
