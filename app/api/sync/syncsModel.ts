import mongoose from 'mongoose';
import { MultiTenantMongooseModel } from 'api/odm/MultiTenantMongooseModel';

const syncSchema = new mongoose.Schema({
  lastSync: Number,
});

export interface Sync extends mongoose.Document {
  lastSync: Number;
}

export default new MultiTenantMongooseModel<Sync>('syncs', syncSchema);
