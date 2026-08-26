import type { Request, Response, NextFunction } from 'express';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

const allowedRoutes = ['login', 'setpassword/', 'unlockaccount/', 'embed/'];
const allowedRoutesMatch = new RegExp(allowedRoutes.join('|'));

const allowedApiCalls = [
  '/api/recoverpassword',
  '/api/resetpassword',
  '/api/unlockaccount',
  '/api/public',
];
const allowedApiMatch = new RegExp(allowedApiCalls.join('|'));

const forbiddenRoutes = ['/api/', '/files/', '/assets/', '/uploaded_documents/'];
const forbiddenRoutesMatch = new RegExp(forbiddenRoutes.join('|'));

const privateInstanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user || req.url.match(allowedRoutesMatch)) {
      next();
      return;
    }

    const settings = await SettingsDataSourceFactory.default().get();

    if (settings.private && !req.url.match(allowedApiMatch)) {
      if (req.url.match(forbiddenRoutesMatch)) {
        res.status(401);
        res.json({ error: 'Unauthorized' });
        return;
      }

      res.redirect('/login');
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
  }
};

export { privateInstanceMiddleware, allowedRoutes, allowedApiCalls, forbiddenRoutes };
