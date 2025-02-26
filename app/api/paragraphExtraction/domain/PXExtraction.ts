enum ExtractionStatus {
  Processing = 'processing',
  Failed = 'failed',
  Finished = 'finished',
  Queued = 'queued',
  Cancelled = 'cancelled',
}

type PXExtractionProps = {
  id: string;
  sourceEntityId: string;
  extractorId: string;
  tenantName: string;
  userId: string;
  status: ExtractionStatus;
};

class PXExtraction {
  static status = ExtractionStatus;

  id: string;

  sourceEntityId: string;

  extractorId: string;

  tenantName: string;

  userId: string;

  status: ExtractionStatus;

  constructor(props: PXExtractionProps) {
    this.sourceEntityId = props.sourceEntityId;
    this.extractorId = props.extractorId;
    this.id = props.id;
    this.tenantName = props.tenantName;
    this.userId = props.userId;
    this.status = props.status;
  }

  static create(props: Omit<PXExtractionProps, 'status'>) {
    return new PXExtraction({ ...props, status: ExtractionStatus.Processing });
  }

  startProcessing() {
    this.status = ExtractionStatus.Processing;
  }
}

export { PXExtraction };

export type { ExtractionStatus };
