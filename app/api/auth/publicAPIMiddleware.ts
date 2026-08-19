import type { Request, Response, NextFunction } from 'express';
import settings from '#api/settings/index.js';
import { captchaMiddleware } from '#api/core/infrastructure/express/captcha/CaptchaMiddleware.js';

export const publicAPIMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { openPublicEndpoint } = await settings.get();
  const bypassCaptcha = req.get('Bypass-Captcha');

  if (openPublicEndpoint && bypassCaptcha === 'true') {
    return next();
  }

  return captchaMiddleware()(req, res, next);
};
