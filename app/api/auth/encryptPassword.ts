import bcrypt from 'bcryptjs';

const saltRounds = 10;

/**
 * @deprecated v1 password hashing, superseded by the domain EncryptedPassword
 * (app/api/core/domain/user/EncryptedPassword.ts), which every production call site now uses.
 * The one remaining caller is the migration app/api/migrations/migrations/181-add-public-user,
 * and it should keep using this forever: historical migrations must stay pinned to the hashing
 * logic that was live when they ran. Test fixtures use it too, to seed a hash the domain can
 * read back. Do not add new callers.
 */
const encryptPassword = async (plainPassword: string) => bcrypt.hash(plainPassword, saltRounds);

export { encryptPassword };
