import type { Request, Response, NextFunction } from 'express';
import { User } from '#api/users/usersModel.js';
import usersModel from '../users/users.js';
import { comparePasswords } from './encryptPassword.js';

const validatePassword = async (submittedPassword: string, requestUser: User) => {
  const user = await usersModel.getById(requestUser._id, '+password');
  const currentPassword = user.password;
  return comparePasswords(submittedPassword, currentPassword);
};

const validatePasswordMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
  const { user, headers } = req;
  const submittedPassword = headers?.authorization?.split('Basic ')[1];

  if (submittedPassword) {
    const decodedPassword = Buffer.from(submittedPassword, 'base64').toString('utf8');
    const validPassword = await validatePassword(decodedPassword, user);

    if (validPassword) {
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Password error', message: 'Forbidden' });
};

export { validatePasswordMiddleWare };
