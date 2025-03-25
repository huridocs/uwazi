enum EntityStatus {
  Processing = 'processing',
  Error = 'error',
  Finished = 'finished',
  Queued = 'queued',
  New = 'new',
  Obsolete = 'obsolete',
}

type PXEntityStatusModel = {
  id: string;
  entitySharedId: string;
  extractorId: string;
  status: EntityStatus;
};

export { EntityStatus };

export type { PXEntityStatusModel };
