import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { PXEntityStatusModel } from './PXEntityStatusModel';

type CreateInput = {
  extractorId: string;
  entitySharedId: string;
};

type GetExistingInput = Partial<CreateInput>;

type CreateForSourceEntitiesInput = {
  sourceTemplateId: string;
  extractorId: string;
};

type MarkAsProcessingInput = {
  entitySharedId: string;
  extractorId: string;
};

type GetAllInput = Partial<PXEntityStatusModel>;

export interface PXEntitiesStatusDataSource {
  getById(entityStatusId: string): Promise<PXEntityStatusModel | undefined>;
  createAsNew(input: CreateInput): Promise<PXEntityStatusModel>;
  setAsError(entityStatusId: string): Promise<PXEntityStatusModel>;
  createForSourceEntities(input: CreateForSourceEntitiesInput): Promise<void>;
  getExisting(input: GetExistingInput): Promise<PXEntityStatusModel | undefined>;
  markAsObsolete(entityStatusId: string): Promise<void>;
  markAsFinished(entityStatusId: string): Promise<void>;
  markAsProcessing(input: MarkAsProcessingInput): Promise<PXEntityStatusModel>;
  delete(entityStatusId: string): Promise<void>;
  deleteBySourceEntity(entitySharedId: string): Promise<void>;
  getAll(input: GetAllInput): ResultSet<PXEntityStatusModel>;
}

export type { GetExistingInput, CreateInput, CreateForSourceEntitiesInput, MarkAsProcessingInput };
