import { randomBytes } from 'node:crypto';
import { encryptPassword } from '#api/auth/encryptPassword.js';

class EncryptedPassword {
  private constructor(private readonly value: string) {}

  static async create(value?: string): Promise<EncryptedPassword> {
    const rawPassword = value ?? randomBytes(32).toString('hex');
    const hashed = await encryptPassword(rawPassword);
    return new EncryptedPassword(hashed);
  }

  static fromHash(hash: string): EncryptedPassword {
    return new EncryptedPassword(hash);
  }

  getValue(): string {
    return this.value;
  }
}

export { EncryptedPassword };
