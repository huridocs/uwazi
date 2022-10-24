import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { Settings } from 'shared/types/settingsType';

const propsWithDBSpecifics = {
  publicFormDestination: { type: String, select: false },
  sync: { type: mongoose.Schema.Types.Mixed, select: false },
  languages: [new mongoose.Schema({}, { strict: false })],
  links: [new mongoose.Schema({}, { strict: false })],
  filters: [new mongoose.Schema({ id: String }, { strict: false })],
  evidencesVault: { type: mongoose.Schema.Types.Mixed, select: false },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  strict: false,
});

const settingsModel = instanceModel<Settings>('settings', mongoSchema);

export { settingsModel };
