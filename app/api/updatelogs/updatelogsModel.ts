import mongoose from 'mongoose';
import { MultiTenantMongooseModel } from 'api/odm/MultiTenantMongooseModel';
import { ObjectIdSchema } from 'shared/types/commonTypes';

const updateLogSchema = new mongoose.Schema({
  timestamp: { type: Number, index: true },
  namespace: String,
  mongoId: { type: mongoose.Schema.Types.ObjectId, index: true },
  deleted: Boolean,
});

updateLogSchema.index({ namespace: 1, timestamp: 1 });
export interface UpdateLog extends mongoose.Document {
  timestamp: number;
  namespace: string;
  mongoId: ObjectIdSchema;
  deleted: boolean;
}

export const model = new MultiTenantMongooseModel<UpdateLog>('updatelogs', updateLogSchema);
