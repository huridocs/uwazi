import { Request, Response, NextFunction } from 'express';
import { CaptchaModel } from './CaptchaModel';
import { CaptchaValue } from '../../shared/types/Captcha';

function getCaptchaValue(req: Request): CaptchaValue | null {
  if (req.body && req.body.captcha) {
    return JSON.parse(req.body.captcha);
  }

  if (req.get('Captcha-text') && req.get('Captcha-id')) {
    return {
      id: req.get('Captcha-id') as string,
      text: req.get('Captcha-text') as string,
    };
  }

  return null;
}

function sendForbidden(res: Response) {
  res.status(403);
  return res.json({ error: 'Captcha error', message: 'Forbidden' });
}

export default () => async (req: Request, res: Response, next: NextFunction) => {
  const submitedCaptcha = getCaptchaValue(req);

  if (!submitedCaptcha) return sendForbidden(res);

  const [captcha] = await CaptchaModel.get({ _id: submitedCaptcha.id });

  if (captcha && captcha.text === submitedCaptcha.text) {
    delete req.body.captcha;
    await CaptchaModel.delete(captcha);
    return next();
  }

  return sendForbidden(res);
};
