import {
  TenantAwareDispatchable,
  TenantAwareDispatchableParams,
} from 'api/queue.v2/application/contracts/TenantAwareDispatchable';

import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';

type Params = TenantAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob extends TenantAwareDispatchable<Params> {
  async handle() {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);

    await useCase.execute(this.params);
  }
}

export { PXExtractParagraphsFromEntityJob };
