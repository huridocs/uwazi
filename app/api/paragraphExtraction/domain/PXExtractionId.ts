import { z } from 'zod';

type CreateExtractionIdInput = {
  extractorId: string;
  entitySharedId: string;
};

type PXExtractionIdProps = {
  id: string;
};

const Schema = z.object({
  id: z.string(),
  extractorId: z.string().min(1),
  entitySharedId: z.string().min(1),
});

class PXExtractionId {
  id: string;

  extractorId: string;

  entitySharedId: string;

  constructor(props: PXExtractionIdProps) {
    this.id = props.id;
    const [extractorId, entitySharedId] = this.id.split('__');
    this.extractorId = extractorId;
    this.entitySharedId = entitySharedId;

    this.validate();
  }

  private validate() {
    Schema.parse({
      id: this.id,
      extractorId: this.extractorId,
      entitySharedId: this.entitySharedId,
    });
  }

  static create(input: CreateExtractionIdInput) {
    return new PXExtractionId({ id: `${input.extractorId}__${input.entitySharedId}` });
  }
}

export { PXExtractionId };
