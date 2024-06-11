import { Request, Response, NextFunction } from 'express';
import { User } from 'api/users/usersModel';
import usersModel from '../users/users';
import { comparePasswords } from './encryptPassword';

const validatePassword = async (submmitedPassword: string, requestUser: User) => {
  const user = await usersModel.getById(requestUser._id, '+password');
  const currentPassword = user.password;
  return comparePasswords(submmitedPassword, currentPassword);
};

const validatePasswordMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
  const { user, headers } = req;
  const submmitedPassword = headers?.authorization?.split('Basic ')[1];

  if (submmitedPassword) {
    const validPassword = await validatePassword(submmitedPassword, user);

    if (validPassword) {
      return next();
    }
  }

  res.status(403);
  return res.json({ error: 'Password error', message: 'Forbidden' });
};

export { validatePasswordMiddleWare };
