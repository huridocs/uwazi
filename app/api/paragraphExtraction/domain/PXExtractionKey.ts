import { z } from 'zod';

type CreateExtractionIdInput = {
  extractorId: string;
  entitySharedId: string;
  tenantName: string;
  userId: string;
};

const Schema = z.object({
  id: z.string(),
  extractorId: z.string().min(1),
  entitySharedId: z.string().min(1),
  tenantName: z.string().min(1),
  userId: z.string().min(1),
});

export class PXExtractionKey {
  private static separator = '_____';

  extractorId: string;

  entitySharedId: string;

  tenantName: string;

  userId: string;

  constructor(id: string) {
    const { extractorId, entitySharedId, tenantName, userId } = PXExtractionKey.split(id);
    this.extractorId = extractorId;
    this.entitySharedId = entitySharedId;
    this.tenantName = tenantName;
    this.userId = userId;

    Schema.parse({
      id: this.id,
      extractorId: this.extractorId,
      entitySharedId: this.entitySharedId,
      tenantName: this.tenantName,
      userId: this.userId,
    });
  }

  get id() {
    return PXExtractionKey.join({
      entitySharedId: this.entitySharedId,
      extractorId: this.extractorId,
      tenantName: this.tenantName,
      userId: this.userId,
    });
  }

  private static split(id: string) {
    const [extractorId, entitySharedId, tenantName, userId] = id.split(PXExtractionKey.separator);

    return { extractorId, entitySharedId, tenantName, userId };
  }

  private static join(input: CreateExtractionIdInput): string {
    const value = [input.extractorId, input.entitySharedId, input.tenantName, input.userId];

    return value.join(PXExtractionKey.separator);
  }

  static create(input: CreateExtractionIdInput) {
    return new PXExtractionKey(PXExtractionKey.join(input));
  }
}

export type { CreateExtractionIdInput };
