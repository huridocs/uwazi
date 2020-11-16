import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { Settings } from 'shared/types/settingsType';

const props = {
  autoexpire: { type: Date, expires: 36000, default: Date.now },
  text: { type: String },
};

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

const CaptchaModel = instanceModel<Settings>('captchas', mongoSchema);

export { CaptchaModel };
