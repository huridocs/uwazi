import mongoose from 'mongoose';
import { MultiTenantMongooseModel } from 'api/odm/MultiTenantMongooseModel';

const syncSchema = new mongoose.Schema({
  lastSync: Number,
  name: String,
});

export interface Sync extends mongoose.Document {
  lastSync: number;
  name: string;
}

export default new MultiTenantMongooseModel<Sync>('syncs', syncSchema);
