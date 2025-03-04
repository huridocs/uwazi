import mongoose from 'mongoose';
import { MongooseModelWrapper } from 'api/odm/MongooseModelWrapper';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { ObjectId } from 'mongodb';

const updateLogSchema = new mongoose.Schema({
  timestamp: { type: Number, index: true },
  namespace: String,
  mongoId: { type: mongoose.Schema.Types.ObjectId, index: true },
  deleted: Boolean,
});

updateLogSchema.index({ namespace: 1, timestamp: 1 });
export interface UpdateLog extends mongoose.Document {
  _id: ObjectId;
  timestamp: number;
  namespace: string;
  mongoId: ObjectIdSchema;
  deleted: boolean;
}

export const model = new MongooseModelWrapper<UpdateLog>('updatelogs', updateLogSchema);
