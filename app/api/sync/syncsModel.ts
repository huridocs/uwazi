import mongoose from 'mongoose';
import { MultiTenantMongooseModel } from 'api/odm/MultiTenantMongooseModel';

const syncSchema = new mongoose.Schema({
  lastSyncs: { type: mongoose.Schema.Types.Mixed, default: {} },
  name: String,
});
export interface Sync extends mongoose.Document {
  lastSyncs: { [key: string]: number };
  name: string;
}

export default new MultiTenantMongooseModel<Sync>('syncs', syncSchema);
