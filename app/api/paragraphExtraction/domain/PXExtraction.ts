enum ExtractionStatus {
  Processing = 'processing',
  Error = 'error',
  Finished = 'finished',
  Queued = 'queued',
}

type PXExtractionProps = {
  id: string;
  sourceEntityId: string;
  extractorId: string;
  status: ExtractionStatus;
};

type PXExtractionModel = {
  id: string;
  entitySharedId: string;
  extractorId: string;
  status: ExtractionStatus;
  paragraphsCount: number;
  failedParagraphsCount: number;
  successfulParagraphsCount: number;
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

export { PXExtraction, ExtractionStatus };

export type { PXExtractionModel };
