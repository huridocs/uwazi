enum EntityStatus {
  Processing = 'processing',
  Error = 'error',
  Finished = 'finished',
  Queued = 'queued',
}

type PXEntityStatusModel = {
  id: string;
  entitySharedId: string;
  extractorId: string;
  status: EntityStatus;
  paragraphsCount: number;
  failedParagraphsCount: number;
  successfulParagraphsCount: number;
};

export { EntityStatus };

export type { PXEntityStatusModel };
