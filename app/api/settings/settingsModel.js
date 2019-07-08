import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const languagesSchema = new mongoose.Schema({
  key: String,
  label: String,
  rtl: Boolean,
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
  contactEmail: String,
  publicFormDestination: { type: String, select: false },
  home_page: String,
  private: Boolean,
  cookiepolicy: Boolean,
  languages: [languagesSchema],
  links: [linksSchema],
  filters: [filtersSchema],
  mailerConfig: String,
  analyticsTrackingId: String,
  matomoConfig: String,
  dateFormat: String,
  custom: mongoose.Schema.Types.Mixed,
  sync: mongoose.Schema.Types.Mixed,
  evidencesVault: mongoose.Schema.Types.Mixed,
  customCSS: String
});

export default instanceModel('settings', settingsSchema);
