import { z } from 'zod';

import { Validator } from 'api/common.v2/contracts/Validator';
import { PXValidationError } from './PXValidationError';

type CreateExtractionIdInput = {
  extractorId: string;
  entitySharedId: string;
};

type PXExtractionIdProps = {
  id: string;
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

  id: string;

  extractorId: string;

  entitySharedId: string;

  constructor(props: PXExtractionIdProps) {
    this.id = props.id;
    const [extractorId, entitySharedId] = this.id.split(PXExtractionId.separator);
    this.extractorId = extractorId;
    this.entitySharedId = entitySharedId;

    validator.validate({
      id: this.id,
      extractorId: this.extractorId,
      entitySharedId: this.entitySharedId,
    });
  }

  static create(input: CreateExtractionIdInput) {
    return new PXExtractionId({
      id: `${input.extractorId}${PXExtractionId.separator}${input.entitySharedId}`,
    });
  }
}

export { PXExtractionId };
