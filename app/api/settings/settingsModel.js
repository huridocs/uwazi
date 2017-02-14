import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const languagesSchema = new mongoose.Schema({
  key: String,
  label: String,
  default: Boolean
});

const settingsSchema = new mongoose.Schema({
  project: String,
  site_name: String,
  languages: [languagesSchema]
});

let Model = mongoose.model('settings', settingsSchema);
export default instanceModel(Model);
