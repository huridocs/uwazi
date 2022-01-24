import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const entitySchema = new mongoose.Schema({
  delta: Number,
  name: String,
  description: String,
  migrationDate: { type: Date, default: Date.now },
  reindex: Boolean,
});

const Model = instanceModel('migrations', entitySchema);

export default Model;
