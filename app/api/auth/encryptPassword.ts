import bcrypt from 'bcryptjs';

const saltRounds = 10;

/**
 * @deprecated v1 password hashing/comparison, superseded by the domain EncryptedPassword
 * (app/api/core/domain/user/EncryptedPassword.ts) for v2 call sites (Login, ValidateCurrentPassword,
 * UpdateUser). Still the live implementation for legacy paths that haven't migrated yet — the v1
 * fallback in validatePasswordMiddleWare.ts, the whole legacy CRUD/login flow in api/users/users.js,
 * and the one-time migration app/api/migrations/migrations/181-add-public-user. Do not remove until
 * those are migrated too (the migration script should keep using this even after that, as historical
 * migrations must stay pinned to the hashing logic that was live when they ran).
 */
const encryptPassword = async (plainPassword: string) => bcrypt.hash(plainPassword, saltRounds);

/** @deprecated see encryptPassword above — same lifecycle, used by the same legacy call sites. */
const comparePasswords = async (plain: string, hashed: string) => bcrypt.compare(plain, hashed);

export { comparePasswords, encryptPassword };
