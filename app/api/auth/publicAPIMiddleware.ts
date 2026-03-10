import type { Request, Response, NextFunction } from 'express';
import settings from '#api/settings/index.js';
import { captchaAuthorization } from './index.js';

export const publicAPIMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { openPublicEndpoint } = await settings.get();
  const bypassCaptcha = req.get('Bypass-Captcha');

  if (openPublicEndpoint && bypassCaptcha === 'true') {
    return next();
  }

  return captchaAuthorization()(req, res, next);
};
