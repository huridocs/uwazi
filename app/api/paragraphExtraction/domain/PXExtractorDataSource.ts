import { PXExtractor } from './PXExtractor';

export interface PXExtractorsDataSource {
  create(extractor: PXExtractor): Promise<void>;
  getById(extractorId: string): Promise<PXExtractor | undefined>;
}
