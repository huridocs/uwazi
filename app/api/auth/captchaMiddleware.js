import { CaptchaModel } from './CaptchaModel';

export default () => async (req, res, next) => {
  if (req.body && req.body.captcha) {
    const submitedCaptcha = JSON.parse(req.body.captcha);
    const captcha = (await CaptchaModel.get({ captcha: submitedCaptcha.captcha }))[0];

    if (captcha && captcha._id.toString() === submitedCaptcha.id) {
      delete req.body.captcha;
      await CaptchaModel.delete(captcha);
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Captcha error', message: 'Forbidden' });
};
