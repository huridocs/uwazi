import type { Request, Response, NextFunction } from 'express';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { captchaMiddleware } from '#api/core/infrastructure/express/captcha/CaptchaMiddleware.js';

export const publicAPIMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { openPublicEndpoint } = await SettingsQueryServiceFactory.default().get();
  const bypassCaptcha = req.get('Bypass-Captcha');

  if (openPublicEndpoint && bypassCaptcha === 'true') {
    return next();
  }

  return captchaMiddleware()(req, res, next);
};
