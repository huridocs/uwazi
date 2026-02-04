import { ObjectId } from 'mongodb';
import { EntityStatus } from '../domain/PXEntityStatusModel.js';

export type MongoPXEntityStatusDBO = {
  _id: ObjectId;
  entitySharedId: string;
  extractorId: ObjectId;
  status: EntityStatus;
};
