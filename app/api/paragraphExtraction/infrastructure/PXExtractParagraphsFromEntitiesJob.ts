import {
  TenantAwareDispatchable,
  TenantAwareDispatchableParams,
} from 'api/queue.v2/application/contracts/TenantAwareDispatchable';

import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';
import { PXValidationError } from '../domain/PXValidationError';

type Params = TenantAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob extends TenantAwareDispatchable<Params> {
  private whiteListError = [
    PXValidationError.codes.SEGMENTATION_FILES_NOT_FOUND,
    PXValidationError.codes.SEGMENTATIONS_UNAVAILABLE,
  ];

  async handle() {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);

    try {
      await useCase.execute(this.params);
    } catch (e) {
      if (!(e instanceof PXValidationError) || this.whiteListError.includes(e.code)) {
        throw e; // unexpect error or whitelisted errors we should retry
      }

      // If we reach here, it means that a Validation error were trowed
      // It does not make any sense to keep retrying
    }
  }
}

export { PXExtractParagraphsFromEntityJob };
