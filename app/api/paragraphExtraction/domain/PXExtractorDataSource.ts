import { PXExtractor } from './PXExtractor';

export type ExistsInput = {
  sourceTemplateId: string;
};

export type DeleteParagraphsInput = {
  entitySharedId: string;
  extractorId: string;
};

export interface PXExtractorsDataSource {
  create(extractor: PXExtractor): Promise<void>;
  getById(extractorId: string): Promise<PXExtractor | undefined>;
  getBySourceTemplate(sourceTemplateId: string): Promise<PXExtractor | undefined>;
  exists(input: ExistsInput): Promise<boolean>;
  delete(extractorId: string): Promise<void>;
  deleteParagraphs(input: DeleteParagraphsInput): Promise<void>;
}
