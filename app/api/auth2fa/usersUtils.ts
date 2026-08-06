import * as otplib from 'otplib';

import settingsModel from '#api/settings/index.js';
import usersModel, { User } from '#api/users/usersModel.js';
import { createError } from '#api/utils/index.js';

const checkUserExists = (user: User) => {
  if (!user) {
    throw createError('User not found', 403);
  }
};

const getUser = async (user: User, options?: string) => {
  const [dbUser] = await usersModel.get({ _id: user._id, deletedAt: { $exists: false } }, options);
  checkUserExists(dbUser);
  return dbUser;
};

const conformSiteName = async (): Promise<string> => {
  const { site_name: siteName = '' } = await settingsModel.get();
  return siteName.length > 30 ? `${siteName.substring(0, 30)}...` : siteName;
};

/**
 * @deprecated v1 fallback for the `v2Auth2fa` flag, used by GenerateTwoFactorSecretController.
 * Superseded by GenerateTwoFactorSecret (app/api/core/application/GenerateTwoFactorSecret.ts).
 * Remove once v2Auth2fa is enabled for all tenants.
 */
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

/**
 * @deprecated v1 fallback for the `v2Auth2fa` flag, used by EnableTwoFactorAuthController and
 * ResetTwoFactorAuthController, and by the login-time 2FA check in app/api/users/users.js
 * (validate2fa). Login-time usage is superseded by Login.checkTwoFactor
 * (app/api/core/application/Login.ts:85). Remove once v2Auth2fa is enabled for all tenants.
 */
export const verifyToken = async (user: User, token: string) => {
  const dbUser = await getUser({ _id: user._id }, '+secret');
  if (otplib.authenticator.verify({ token, secret: dbUser.secret || undefined })) {
    return { validToken: true, dbUser };
  }

  throw createError('Two-factor authentication failed.', 401);
};

/**
 * @deprecated v1 fallback for the `v2Auth2fa` flag, used by EnableTwoFactorAuthController.
 * Superseded by EnableTwoFactorAuth (app/api/core/application/EnableTwoFactorAuth.ts).
 * Remove once v2Auth2fa is enabled for all tenants.
 */
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

/**
 * @deprecated v1 fallback for the `v2Auth2fa` flag, used by ResetTwoFactorAuthController.
 * Superseded by ResetTwoFactorAuth (app/api/core/application/ResetTwoFactorAuth.ts).
 * Remove once v2Auth2fa is enabled for all tenants.
 */
export const reset2fa = async (user: User) => {
  const dbUser = await getUser({ _id: user._id });
  return usersModel.save({ _id: dbUser._id, using2fa: false, secret: null });
};
