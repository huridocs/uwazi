enum ExtractionStatus {
  Processing = 'processing',
  Failed = 'failed',
  Finished = 'finished',
  Queued = 'queued',
}

type PXExtractionProps = {
  id: string;
  sourceEntityId: string;
  extractorId: string;
  status: ExtractionStatus;
};

class PXExtraction {
  static status = ExtractionStatus;

  id: string;

  sourceEntityId: string;

  extractorId: string;

  status: ExtractionStatus;

  constructor(props: PXExtractionProps) {
    this.sourceEntityId = props.sourceEntityId;
    this.extractorId = props.extractorId;
    this.id = props.id;
    this.status = props.status;
  }

  processing() {
    this.status = ExtractionStatus.Processing;
  }
}

export { PXExtraction };

export type { ExtractionStatus };
