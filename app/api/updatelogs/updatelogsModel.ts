import mongoose from 'mongoose';
import { MultiTenantMongooseModel } from 'api/odm/MultiTenantMongooseModel';

const updateLogSchema = new mongoose.Schema({
  timestamp: Number,
  namespace: String,
  mongoId: { type: mongoose.Schema.Types.ObjectId, index: true },
  deleted: Boolean,
});

export interface UpdateLog extends mongoose.Document {
  timestamp: Number;
  namespace: String;
  mongoId: mongoose.Schema.Types.ObjectId;
  deleted: Boolean;
}

export const model = new MultiTenantMongooseModel<UpdateLog>('updatelogs', updateLogSchema);
