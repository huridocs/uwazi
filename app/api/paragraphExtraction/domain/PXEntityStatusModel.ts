enum EntityStatus {
  New = 'new',
  Processing = 'processing',
  ProcessingObsolete = 'processing_obsolete',
  Obsolete = 'obsolete',
  Error = 'error',
  Processed = 'processed',
}

type PXEntityStatusModel = {
  id: string;
  entitySharedId: string;
  extractorId: string;
  status: EntityStatus;
};

export { EntityStatus };

export type { PXEntityStatusModel };
