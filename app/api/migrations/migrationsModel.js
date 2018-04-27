import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const entitySchema = new mongoose.Schema({
  delta: Number,
  name: String,
  description: String,
  migrationDate: { type: Date, default: Date.now },
});

const schema = mongoose.model('migrations', entitySchema);
const Model = instanceModel(schema);

export default Model;
