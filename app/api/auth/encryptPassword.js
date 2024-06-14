import bcrypt from 'bcryptjs';

const saltRounds = 10;

const encryptPassword = async plainPassword => bcrypt.hash(plainPassword, saltRounds);
const comparePasswords = async (plain, hashed) => bcrypt.compare(plain, hashed);

export { comparePasswords, encryptPassword };
