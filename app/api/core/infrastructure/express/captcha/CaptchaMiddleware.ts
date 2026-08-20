import type { Request, Response, NextFunction } from 'express';
import { VerifyCaptchaUseCaseFactory } from '#api/core/infrastructure/factories/CaptchaUseCaseFactories.js';
import { CaptchaValue } from '#shared/types/Captcha.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

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

  const startTime = Date.now();
  try {
    await VerifyCaptchaUseCaseFactory.default().execute(submitedCaptcha);
    delete req.body.captcha;

    ExecutionContext.logger.info('Captcha verified successfully', {
      namespace: 'Auth_Captcha',
      success: true,
      durationMs: Date.now() - startTime,
    });

    return next();
  } catch (error: unknown) {
    ExecutionContext.logger.info(
      `Captcha verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        namespace: 'Auth_Captcha',
        success: false,
        error: JSON.stringify(error),
        notify: true,
      }
    );

    return sendForbidden(res);
  }
};

export { captchaMiddleware };
