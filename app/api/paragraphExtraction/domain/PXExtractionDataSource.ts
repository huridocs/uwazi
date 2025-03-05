import { PXExtraction } from './PXExtraction';

type GetExistingInput = {
  extractorId: string;
  entitySharedId: string;
};

export interface PXExtractionsDataSource {
  save(extraction: PXExtraction): Promise<void>;
  getExisting(input: GetExistingInput): Promise<PXExtraction | undefined>;
}

export type { GetExistingInput };
