import mongoose from 'mongoose';
import { MongooseModelWrapper } from '#api/odm/MongooseModelWrapper.js';

const syncSchema = new mongoose.Schema({
  lastSyncs: { type: mongoose.Schema.Types.Mixed, default: {} },
  name: String,
  consecutiveFailures: { type: Number, default: 0 },
});
export interface Sync extends mongoose.Document {
  lastSyncs: { [key: string]: number };
  name: string;
  consecutiveFailures: number;
}

export default new MongooseModelWrapper<Sync>('syncs', syncSchema);
