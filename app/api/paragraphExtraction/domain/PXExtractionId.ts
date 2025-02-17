import { z } from 'zod';

import { Validator } from 'api/common.v2/contracts/Validator';
import { PXValidationError } from './PXValidationError';

type CreateExtractionIdInput = {
  extractorId: string;
  entitySharedId: string;
  tenantName: string;
  userId: string;
};

const validator = new Validator({
  schema: Validator.z.object({
    id: z.string(),
    extractorId: z.string().min(1),
    entitySharedId: z.string().min(1),
    tenantName: z.string().min(1),
    userId: z.string().min(1),
  }),
  name: PXValidationError.name,
  code: PXValidationError.codes.EXTRACTION_ID_INVALID,
});

class PXExtractionId {
  private static separator = '_____';

  extractorId: string;

  entitySharedId: string;

  tenantName: string;

  userId: string;

  constructor(id: string) {
    const { extractorId, entitySharedId, tenantName, userId } = PXExtractionId.split(id);
    this.extractorId = extractorId;
    this.entitySharedId = entitySharedId;
    this.tenantName = tenantName;
    this.userId = userId;

    validator.validate({
      id: this.id,
      extractorId: this.extractorId,
      entitySharedId: this.entitySharedId,
      tenantName: this.tenantName,
      userId: this.userId,
    });
  }

  get id() {
    return PXExtractionId.join({
      entitySharedId: this.entitySharedId,
      extractorId: this.extractorId,
      tenantName: this.tenantName,
      userId: this.userId,
    });
  }

  private static split(id: string) {
    const [extractorId, entitySharedId, tenantName, userId] = id.split(PXExtractionId.separator);

    return { extractorId, entitySharedId, tenantName, userId };
  }

  private static join(input: CreateExtractionIdInput): string {
    const value = [input.extractorId, input.entitySharedId, input.tenantName, input.userId];

    return value.join(PXExtractionId.separator);
  }

  static create(input: CreateExtractionIdInput) {
    return new PXExtractionId(PXExtractionId.join(input));
  }
}

export { PXExtractionId };

export type { CreateExtractionIdInput };
/**
 * We need to persist the PXExtraction on the database
 *
 * 1. We need to somehow create relationship between an Extractor, sharedId, User, and status
 *
 * 2. The new key, it would be tenantName + ExtractionId
 */
