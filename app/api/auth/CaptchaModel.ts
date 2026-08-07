import mongoose from 'mongoose';
import { instanceModel } from '#api/odm/index.js';

const props = {
  autoexpire: { type: Date, expires: 36000, default: Date.now },
  text: { type: String },
};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

/**
 * @deprecated v1 fallback for the `v2Captcha` flag, used by the v1 branches of
 * app/api/auth/captchaMiddleware.ts and the `/api/captcha` route in app/api/auth/routes.js.
 * Superseded by MongoCaptchaDataSource (app/api/core/infrastructure/mongodb/captcha/MongoCaptchaDataSource.ts).
 * Remove once v2Captcha is enabled for all tenants.
 */
const CaptchaModel = instanceModel('captchas', mongoSchema);

export { CaptchaModel };
