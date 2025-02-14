import { z } from 'zod';

import { Validator } from 'api/common.v2/contracts/Validator';
import { PXValidationError } from './PXValidationError';

type CreateExtractionIdInput = {
  extractorId: string;
  entitySharedId: string;
};

const validator = new Validator({
  schema: Validator.z.object({
    id: z.string(),
    extractorId: z.string().min(1),
    entitySharedId: z.string().min(1),
  }),
  name: PXValidationError.name,
  code: PXValidationError.codes.EXTRACTION_ID_INVALID,
});

class PXExtractionId {
  private static separator = '_____';

  extractorId: string;

  entitySharedId: string;

  constructor(id: string) {
    const { extractorId, entitySharedId } = PXExtractionId.split(id);
    this.extractorId = extractorId;
    this.entitySharedId = entitySharedId;

    validator.validate({
      id: this.id,
      extractorId: this.extractorId,
      entitySharedId: this.entitySharedId,
    });
  }

  get id() {
    return PXExtractionId.join({
      entitySharedId: this.entitySharedId,
      extractorId: this.extractorId,
    });
  }

  private static split(id: string) {
    const [extractorId, entitySharedId] = id.split(PXExtractionId.separator);

    return { extractorId, entitySharedId };
  }

  private static join(input: CreateExtractionIdInput): string {
    return `${input.extractorId}${PXExtractionId.separator}${input.entitySharedId}`;
  }

  static create(input: CreateExtractionIdInput) {
    return new PXExtractionId(PXExtractionId.join(input));
  }
}

export { PXExtractionId };
