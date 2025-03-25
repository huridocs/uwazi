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

type CreateForSourceEntitiesInput = {
  sourceTemplateId: string;
  extractorId: string;
};

type MarkAsQueuedInput = {
  entitySharedId: string;
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
  createForSourceEntities(input: CreateForSourceEntitiesInput): Promise<void>;
  getExisting(input: GetExistingInput): Promise<PXEntityStatusModel | undefined>;
  markAsObsolete(entityStatusId: string): Promise<void>;
  markAsQueued(input: MarkAsQueuedInput): Promise<PXEntityStatusModel>;
}

export type {
  GetExistingInput,
  CreateInput,
  EnqueueInput,
  InitProcessInput,
  UpdateParagraphsCountInput,
  CreateForSourceEntitiesInput,
  MarkAsQueuedInput,
};
