import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

class EncryptedPassword {
  private static saltRounds = 10;

  private constructor(private readonly value: string) {}

  private static async encryptPassword(plainPassword: string) {
    return bcrypt.hash(plainPassword, EncryptedPassword.saltRounds);
  }

  private static async comparePasswords(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
  }

  static async create(value?: string): Promise<EncryptedPassword> {
    const rawPassword = value ?? randomBytes(32).toString('hex');
    const hashed = await EncryptedPassword.encryptPassword(rawPassword);

    return new EncryptedPassword(hashed);
  }

  static fromHash(hash: string): EncryptedPassword {
    return new EncryptedPassword(hash);
  }

  async compare(plain: string): Promise<boolean> {
    return EncryptedPassword.comparePasswords(plain, this.value);
  }

  getValue(): string {
    return this.value;
  }
}

export { EncryptedPassword };
