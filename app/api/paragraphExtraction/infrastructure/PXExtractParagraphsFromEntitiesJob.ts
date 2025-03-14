import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/queue.v2/application/contracts/UserAwareDispatchable';

import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';

type Params = UserAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob extends UserAwareDispatchable<Params> {
  async handle() {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);

    await useCase.execute(this.params);
  }
}

export { PXExtractParagraphsFromEntityJob };
