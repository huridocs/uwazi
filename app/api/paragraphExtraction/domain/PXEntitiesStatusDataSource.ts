import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { PXEntityStatusModel, EntityStatus } from './PXEntityStatusModel';

type CreateInput = {
  extractorId: string;
  entitySharedId: string;
  status: EntityStatus;
};

type GetExistingInput = Partial<CreateInput>;

type GetAllInput = Partial<PXEntityStatusModel>;

export interface PXEntitiesStatusDataSource {
  getById(entityStatusId: string): Promise<PXEntityStatusModel | undefined>;
  createWithStatus(input: CreateInput): Promise<PXEntityStatusModel>;
  getExisting(input: GetExistingInput): Promise<PXEntityStatusModel | undefined>;
  markAsError(entityStatusId: string): Promise<void>;
  markAsObsolete(entityStatusId: string): Promise<void>;
  markAsProcessed(entityStatusId: string): Promise<void>;
  markAsProcessing(entityStatusId: string): Promise<void>;
  delete(entityStatusId: string): Promise<void>;
  deleteBySourceEntity(entitySharedId: string): Promise<void>;
  getAll(input: GetAllInput): ResultSet<PXEntityStatusModel>;
}

export type { GetExistingInput, GetAllInput, CreateInput };
