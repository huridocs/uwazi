import bcrypt from 'bcryptjs';

const saltRounds = 10;

const encryptPassword = async (plainPassword: string) => bcrypt.hash(plainPassword, saltRounds);
const comparePasswords = async (plain: string, hashed: string) => bcrypt.compare(plain, hashed);

export { comparePasswords, encryptPassword };
