import { ObjectId } from 'mongodb';
import { EntityStatus } from '../domain/PXEntityStatusModel';

export type MongoPXEntityStatusDBO = {
  _id: ObjectId;
  entitySharedId: string;
  extractorId: ObjectId;
  status: EntityStatus;
};
