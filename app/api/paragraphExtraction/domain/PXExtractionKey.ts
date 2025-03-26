import { z } from 'zod';

type CreateExtractionIdInput = {
  entityStatusId: string;
  tenantName: string;
  userId: string;
};

const Schema = z.object({
  entityStatusId: z.string().min(1),
  tenantName: z.string().min(1),
  userId: z.string().min(1),
});

export class PXExtractionKey {
  static separator = '_____';

  key: string;

  entityStatusId: string;

  tenantName: string;

  userId: string;

  constructor(key: string) {
    const { tenantName, extractionId, userId } = PXExtractionKey.decomposeKey(key);
    this.key = key;
    this.entityStatusId = extractionId;
    this.tenantName = tenantName;
    this.userId = userId;

    Schema.parse(this);
  }

  private static decomposeKey(id: string) {
    const [tenantName, extractionId, userId] = id.split(PXExtractionKey.separator);

    return { tenantName, extractionId, userId };
  }

  private static composeKey(input: CreateExtractionIdInput): string {
    const value = [input.tenantName, input.entityStatusId, input.userId];

    return value.join(PXExtractionKey.separator);
  }

  static create(input: CreateExtractionIdInput) {
    return new PXExtractionKey(PXExtractionKey.composeKey(input));
  }
}

export type { CreateExtractionIdInput };
