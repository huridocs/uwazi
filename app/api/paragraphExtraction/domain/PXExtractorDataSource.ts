import { PXExtractor } from './PXExtractor';

type ExistsInput = {
  sourceTemplateId: string;
};

type GetParagraphsIdsInput = {
  entitySharedId: string;
  extractorId: string;
};

interface PXExtractorsDataSource {
  create(extractor: PXExtractor): Promise<void>;
  getById(extractorId: string): Promise<PXExtractor | undefined>;
  getBySourceTemplate(sourceTemplateId: string): Promise<PXExtractor | undefined>;
  exists(input: ExistsInput): Promise<boolean>;
  delete(extractorId: string): Promise<void>;
  getParagraphsIds(input: GetParagraphsIdsInput): Promise<string[]>;
}

export type { PXExtractorsDataSource, GetParagraphsIdsInput, ExistsInput };
