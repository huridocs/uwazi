import { PXExtraction } from './PXExtraction';

type GetExistingInput = {
  extractorId: string;
  entitySharedId: string;
  tenantName: string;
  userId: string;
};

export interface PXExtractionsDataSource {
  save(extraction: PXExtraction): Promise<void>;
  edit(extraction: PXExtraction): Promise<void>;
  create(extraction: PXExtraction): Promise<void>;
  getExisting(input: GetExistingInput): Promise<PXExtraction | undefined>;
}

export type { GetExistingInput };
