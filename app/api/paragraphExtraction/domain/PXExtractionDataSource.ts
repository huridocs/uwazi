import { PXExtraction, PXExtractionModel } from './PXExtraction';

type CreateInput = {
  extractorId: string;
  entitySharedId: string;
};

type GetExistingInput = CreateInput;

type EnqueueInput = GetExistingInput;

type InitProcessInput = GetExistingInput;

type UpdateParagraphsCountInput = {
  id: string;
  count: number;
};

export interface PXExtractionsDataSource {
  getById(extractionId: string): Promise<PXExtractionModel | undefined>;
  getExisting(input: GetExistingInput): Promise<PXExtraction | undefined>;
  initProcess(extractionId: string): Promise<PXExtractionModel>;
  incrementSuccess(extractionId: string): Promise<PXExtractionModel>;
  incrementFail(extractionId: string): Promise<PXExtractionModel>;
  create(input: CreateInput): Promise<PXExtractionModel>;
  setAsError(extractionId: string): Promise<PXExtractionModel>;
  updateParagraphsCount(input: UpdateParagraphsCountInput): Promise<PXExtractionModel>;
}

export type {
  GetExistingInput,
  CreateInput,
  EnqueueInput,
  InitProcessInput,
  UpdateParagraphsCountInput,
};
