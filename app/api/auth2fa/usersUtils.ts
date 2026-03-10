import * as otplib from 'otplib';

import settingsModel from 'api/settings';
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

const conformSiteName = async (): Promise<string> => {
  const { site_name: siteName = '' } = await settingsModel.get();
  return siteName.length > 30 ? `${siteName.substring(0, 30)}...` : siteName;
};

export const setSecret = async (user: User) => {
  const dbUser = await getUser({ _id: user._id });
  const siteName = await conformSiteName();
  const secret = otplib.authenticator.generateSecret();
  const otpauth = otplib.authenticator.keyuri(dbUser.username || '', siteName, secret);

  if (!dbUser.using2fa) {
    await usersModel.save({ _id: dbUser._id, secret });
    return { secret, otpauth };
  }

  throw createError('Unauthorized', 401);
};

export const verifyToken = async (user: User, token: string) => {
  const dbUser = await getUser({ _id: user._id }, '+secret');
  if (otplib.authenticator.verify({ token, secret: dbUser.secret || undefined })) {
    return { validToken: true, dbUser };
  }

  throw createError('Two-factor authentication failed.', 401);
};

export const enable2fa = async (user: User, token: string) => {
  try {
    const { dbUser } = await verifyToken(user, token);
    return usersModel.save({ _id: dbUser._id, using2fa: true });
  } catch (err) {
    if (err.code === 401) {
      throw createError('The token does not validate against the secret key!', 409);
    }

    throw err;
  }
};

export const reset2fa = async (user: User) => {
  const dbUser = await getUser({ _id: user._id });
  return usersModel.save({ _id: dbUser._id, using2fa: false, secret: null });
};
