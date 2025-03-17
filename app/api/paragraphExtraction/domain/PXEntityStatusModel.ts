enum EntityStatus {
  Processing = 'processing',
  Error = 'error',
  Finished = 'finished',
  Queued = 'queued',
}

type PXExtractionProps = {
  id: string;
  sourceEntityId: string;
  extractorId: string;
  status: EntityStatus;
};

type PXEntityStatusModel = {
  id: string;
  entitySharedId: string;
  extractorId: string;
  status: EntityStatus;
  paragraphsCount: number;
  failedParagraphsCount: number;
  successfulParagraphsCount: number;
};

class PXExtraction {
  static status = EntityStatus;

  id: string;

  sourceEntityId: string;

  extractorId: string;

  status: EntityStatus;

  constructor(props: PXExtractionProps) {
    this.sourceEntityId = props.sourceEntityId;
    this.extractorId = props.extractorId;
    this.id = props.id;
    this.status = props.status;
  }

  processing() {
    this.status = EntityStatus.Processing;
  }
}

export { PXExtraction, EntityStatus };

export type { PXEntityStatusModel };
