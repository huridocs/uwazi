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
  index: Number,
  items: mongoose.Schema.Types.Mixed
});

const settingsSchema = new mongoose.Schema({
  project: String,
  site_name: String,
  home_page: String,
  private: Boolean,
  languages: [languagesSchema],
  links: [linksSchema],
  filters: [filtersSchema],
  mailerConfig: String,
  analyticsTrackingId: String,
  matomoConfig: String,
  dateFormat: String,
  custom: mongoose.Schema.Types.Mixed,
  customCSS: String
});

const Model = mongoose.model('settings', settingsSchema);
export default instanceModel(Model);
