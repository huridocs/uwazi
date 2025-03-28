import { PXExtractor } from './PXExtractor';

export interface PXExtractorsDataSource {
  create(extractor: PXExtractor): Promise<void>;
  getById(extractorId: string): Promise<PXExtractor | undefined>;
  getBySourceTemplate(sourceTemplateId: string): Promise<PXExtractor | undefined>;
}
