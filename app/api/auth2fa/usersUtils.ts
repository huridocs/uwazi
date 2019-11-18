/** @format */

import * as otplib from 'otplib';

import usersModel, { User } from 'api/users/usersModel';
import { createError } from 'api/utils';

const checkUserExists = (user: User) => {
  if (!user) {
    throw createError('User not found', 403);
  }
};

export const setSecret = async (user: User) => {
  const [dbUser] = await usersModel.get({ _id: user._id });

  checkUserExists(dbUser);

  const secret = otplib.authenticator.generateSecret();
  const otpauth = otplib.authenticator.keyuri(dbUser.username || '', 'Uwazi', secret);

  if (!dbUser.using2fa) {
    await usersModel.save({ _id: dbUser._id, secret });
  }

  return { secret, otpauth };
};

export const enable2fa = async (user: User, token: string) => {
  const [dbUser] = await usersModel.get({ _id: user._id }, '+secret');

  checkUserExists(dbUser);

  const isValid = otplib.authenticator.verify({ token, secret: dbUser.secret });

  if (isValid) {
    return usersModel.save({ _id: dbUser._id, using2fa: true });
  }

  throw createError('The token does not validate against the secret key!', 409);
};
