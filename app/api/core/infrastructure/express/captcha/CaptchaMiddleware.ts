import type { Request, Response, NextFunction } from 'express';
import { VerifyCaptchaUseCaseFactory } from '#api/core/infrastructure/factories/CaptchaUseCaseFactories.js';
import { CaptchaValue } from '#shared/types/Captcha.js';

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

const captchaMiddleware = () => async (req: Request, res: Response, next: NextFunction) => {
  const submitedCaptcha = getCaptchaValue(req);

  if (!submitedCaptcha) return sendForbidden(res);

  try {
    await VerifyCaptchaUseCaseFactory.default().execute(submitedCaptcha);
    delete req.body.captcha;

    return next();
  } catch (error: unknown) {
    return sendForbidden(res);
  }
};

export { captchaMiddleware };
