import type { Request, Response, NextFunction } from 'express';
import { User } from '#api/users/usersModel.js';
import { ValidateCurrentPasswordUseCaseFactory } from '#api/core/infrastructure/factories/ValidateCurrentPasswordUseCaseFactory.js';

const validatePassword = async (submittedPassword: string, requestUser: User) => {
  if (!requestUser.username) {
    return false;
  }

  const isValid = await ValidateCurrentPasswordUseCaseFactory.default().execute({
    username: requestUser.username,
    submittedPassword,
  });

  return isValid;
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
