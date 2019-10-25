/** @format */

import mongoose from 'mongoose';

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

export const model = mongoose.model<UpdateLog>('updatelogs', updateLogSchema);
