import { PXEntityStatusModel } from './PXEntityStatusModel';

type CreateInput = {
  extractorId: string;
  entitySharedId: string;
};

type GetExistingInput = CreateInput;

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
  createAsNew(input: CreateInput): Promise<PXEntityStatusModel>;
  setAsError(extractionId: string): Promise<PXEntityStatusModel>;
  createForSourceEntities(input: CreateForSourceEntitiesInput): Promise<void>;
  getExisting(input: GetExistingInput): Promise<PXEntityStatusModel | undefined>;
  markAsObsolete(entityStatusId: string): Promise<void>;
  markAsProcessing(input: MarkAsQueuedInput): Promise<PXEntityStatusModel>;
  markAsFinished(entityStatusId: string): Promise<void>;
}

export type { GetExistingInput, CreateInput, CreateForSourceEntitiesInput, MarkAsQueuedInput };
