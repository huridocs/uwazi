import type { Request, Response, NextFunction } from 'express';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

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
  const startTime = Date.now();
  try {
    if (req.user || req.url.match(allowedRoutesMatch)) {
      next();
      return;
    }

    const settings = await SettingsDataSourceFactory.default().get();

    if (settings.private && !req.url.match(allowedApiMatch)) {
      if (req.url.match(forbiddenRoutesMatch)) {
        ExecutionContext.logger.info('Private instance access blocked', {
          namespace: 'Auth_PrivateInstance',
          success: true,
          durationMs: Date.now() - startTime,
        });

        res.status(401);
        res.json({ error: 'Unauthorized' });
        return;
      }

      res.redirect('/login');
      return;
    }

    next();
  } catch (error: unknown) {
    ExecutionContext.logger.info(
      `Private instance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        namespace: 'Auth_PrivateInstance',
        success: false,
        error: JSON.stringify(error),
        notify: true,
      }
    );

    next(error);
  }
};

export { privateInstanceMiddleware, allowedRoutes, allowedApiCalls, forbiddenRoutes };
