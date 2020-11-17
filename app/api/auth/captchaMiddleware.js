import { CaptchaModel } from './CaptchaModel';

export default () => async (req, res, next) => {
  if (req.body && req.body.captcha) {
    const submitedCaptcha = JSON.parse(req.body.captcha);
    console.log(submitedCaptcha);
    const [captcha] = await CaptchaModel.get({ _id: submitedCaptcha.id });
    console.log(captcha);
    if (captcha && captcha.text === submitedCaptcha.text) {
      delete req.body.captcha;
      await CaptchaModel.delete(captcha);
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Captcha error', message: 'Forbidden' });
};
