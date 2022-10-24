import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const props = {
  autoexpire: { type: Date, expires: 36000, default: Date.now },
  text: { type: String },
};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

const CaptchaModel = instanceModel('captchas', mongoSchema);

export { CaptchaModel };
