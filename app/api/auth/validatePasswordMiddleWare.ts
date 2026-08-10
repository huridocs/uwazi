import type { Request, Response, NextFunction } from 'express';
import { User } from '#api/users/usersModel.js';
import usersModel from '../users/users.js';
import { comparePasswords } from './encryptPassword.js';
import { tenants } from '#api/tenants/index.js';
import { ValidateCurrentPasswordUseCaseFactory } from '#api/core/infrastructure/factories/ValidateCurrentPasswordUseCaseFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

/**
 * @deprecated v1 fallback for the `v2PasswordReauth` flag, superseded by validatePasswordV2 below.
 * Remove once v2PasswordReauth is enabled for all tenants.
 */
const validatePassword = async (submittedPassword: string, requestUser: User) => {
  const user = await usersModel.getById(requestUser._id, '+password');
  const currentPassword = user.password;
  return comparePasswords(submittedPassword, currentPassword);
};

const validatePasswordV2 = async (submittedPassword: string, requestUser: User) => {
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
    const validPassword = tenants.current().featureFlags?.v2PasswordReauth
      ? await validatePasswordV2(decodedPassword, user)
      : await validatePassword(decodedPassword, user);

    if (validPassword) {
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Password error', message: 'Forbidden' });
};

export { validatePasswordMiddleWare };
