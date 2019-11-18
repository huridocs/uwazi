/** @format */

import * as otplib from 'otplib';

import usersModel, { User } from 'api/users/usersModel';
import { createError } from 'api/utils';

const checkUserExists = (user: User) => {
  if (!user) {
    throw createError('User not found', 403);
  }
};

const getUser = async (user: User, options?: string) => {
  const [dbUser] = await usersModel.get({ _id: user._id }, options);
  checkUserExists(dbUser);
  return dbUser;
};

export const setSecret = async (user: User) => {
  const dbUser = await getUser({ _id: user._id });
  const secret = otplib.authenticator.generateSecret();
  const otpauth = otplib.authenticator.keyuri(dbUser.username || '', 'Uwazi', secret);

  if (!dbUser.using2fa) {
    await usersModel.save({ _id: dbUser._id, secret });
    return { secret, otpauth };
  }

  throw createError('Unauthorized', 401);
};

export const enable2fa = async (user: User, token: string) => {
  const dbUser = await getUser({ _id: user._id }, '+secret');
  const isValid = otplib.authenticator.verify({ token, secret: dbUser.secret });

  if (isValid) {
    return usersModel.save({ _id: dbUser._id, using2fa: true });
  }

  throw createError('The token does not validate against the secret key!', 409);
};
