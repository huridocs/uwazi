import { Request, Response, NextFunction } from 'express';
import usersModel from '../users/users';
import { comparePasswords } from './encryptPassword';

const validatePassword = async (submmitedPassword: string, currentPassword: string) =>
  comparePasswords(submmitedPassword, currentPassword);

// eslint-disable-next-line max-statements
const validatePasswordMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(403);
    return res.json({ error: 'User error', message: 'Forbidden' });
  }

  const authorization = req.headers?.authorization || '';
  const { user } = req;

  const currentPassword = (await usersModel.getById(user._id, '+password')).password;
  const submmitedPassword = authorization?.split('Basic ')[1] || '';
  const validPassword = await validatePassword(submmitedPassword, currentPassword);

  if (validPassword) {
    return next();
  }

  res.status(403);
  return res.json({ error: 'Password error', message: 'Forbidden' });
};

export { validatePasswordMiddleWare };
