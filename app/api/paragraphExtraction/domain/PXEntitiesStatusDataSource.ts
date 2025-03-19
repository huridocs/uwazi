import { PXEntityStatusModel } from './PXEntityStatusModel';

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

type CreateForEachSourceEntityInput = {
  sourceTemplateId: string;
  extractorId: string;
};

export interface PXEntitiesStatusDataSource {
  getById(extractionId: string): Promise<PXEntityStatusModel | undefined>;
  initProcess(extractionId: string): Promise<PXEntityStatusModel>;
  incrementSuccess(extractionId: string): Promise<PXEntityStatusModel>;
  incrementFail(extractionId: string): Promise<PXEntityStatusModel>;
  create(input: CreateInput): Promise<PXEntityStatusModel>;
  setAsError(extractionId: string): Promise<PXEntityStatusModel>;
  updateParagraphsCount(input: UpdateParagraphsCountInput): Promise<PXEntityStatusModel>;
  createForEachSourceEntity(input: CreateForEachSourceEntityInput): Promise<void>;
}

export type {
  GetExistingInput,
  CreateInput,
  EnqueueInput,
  InitProcessInput,
  UpdateParagraphsCountInput,
  CreateForEachSourceEntityInput,
};
