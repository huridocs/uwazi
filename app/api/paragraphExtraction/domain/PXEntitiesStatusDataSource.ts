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

type GetAllInput = Partial<PXEntityStatusModel>;

export interface PXEntitiesStatusDataSource {
  getById(entityStatusId: string): Promise<PXEntityStatusModel | undefined>;
  createAsNew(input: CreateInput): Promise<PXEntityStatusModel>;
  createForSourceEntities(input: CreateForSourceEntitiesInput): Promise<void>;
  getExisting(input: GetExistingInput): Promise<PXEntityStatusModel | undefined>;
  markAsError(entityStatusId: string): Promise<void>;
  markAsObsolete(entityStatusId: string): Promise<void>;
  markAsProcessed(entityStatusId: string): Promise<void>;
  markAsProcessing(entityStatusId: string): Promise<void>;
  delete(entityStatusId: string): Promise<void>;
  deleteBySourceEntity(entitySharedId: string): Promise<void>;
  getAll(input: GetAllInput): ResultSet<PXEntityStatusModel>;
}

export type { GetExistingInput, CreateInput, CreateForSourceEntitiesInput };
