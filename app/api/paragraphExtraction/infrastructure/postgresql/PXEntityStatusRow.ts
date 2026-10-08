import { EntityStatus } from '../../domain/PXEntityStatusModel.js';

export type PXEntityStatusRow = {
  _id: string;
  entitySharedId: string;
  extractorId: string;
  status: EntityStatus;
};
