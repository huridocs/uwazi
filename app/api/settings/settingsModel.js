import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const languagesSchema = new mongoose.Schema({
  key: String,
  label: String,
  default: Boolean
});

const linksSchema = new mongoose.Schema({
  title: String,
  url: String
});

const filtersSchema = new mongoose.Schema({
  id: String,
  name: String,
  items: mongoose.Schema.Types.Mixed
});

const settingsSchema = new mongoose.Schema({
  project: String,
  site_name: String,
  home_page: String,
  languages: [languagesSchema],
  links: [linksSchema],
  filters: [filtersSchema],
  mailerConfig: String,
  analyticsTrackingId: String,
  dateFormat: String
});

let Model = mongoose.model('settings', settingsSchema);
export default instanceModel(Model);
