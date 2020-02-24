import bcrypt from 'bcrypt';

const saltRounds = 10;

const encryptPassowrd = async plainPassword => bcrypt.hash(plainPassword, saltRounds);
const comparePasswords = async (plain, hashed) => bcrypt.compare(plain, hashed);

export default encryptPassowrd;

export { comparePasswords };
