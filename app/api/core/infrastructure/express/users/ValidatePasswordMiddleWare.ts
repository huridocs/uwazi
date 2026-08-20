import type { Request, Response, NextFunction } from 'express';
import { User } from '#api/users/usersModel.js';
import { ValidateCurrentPasswordUseCaseFactory } from '#api/core/infrastructure/factories/ValidateCurrentPasswordUseCaseFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const validatePassword = async (submittedPassword: string, requestUser: User) => {
  const startTime = Date.now();
  try {
    if (!requestUser.username) {
      return false;
    }

    const isValid = await ValidateCurrentPasswordUseCaseFactory.default().execute({
      username: requestUser.username,
      submittedPassword,
    });

    ExecutionContext.logger.info('Password reauthentication executed', {
      namespace: 'Auth_PasswordReauth',
      success: true,
      durationMs: Date.now() - startTime,
    });

    return isValid;
  } catch (error: unknown) {
    ExecutionContext.logger.info(
      `Password reauthentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        namespace: 'Auth_PasswordReauth',
        success: false,
        error: JSON.stringify(error),
        notify: true,
      }
    );

    throw error;
  }
};

const validatePasswordMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
  const { user, headers } = req;
  const submittedPassword = headers?.authorization?.split('Basic ')[1];

  if (submittedPassword) {
    const decodedPassword = Buffer.from(submittedPassword, 'base64').toString('utf8');

    if (await validatePassword(decodedPassword, user)) {
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Password error', message: 'Forbidden' });
};

export { validatePasswordMiddleWare };
