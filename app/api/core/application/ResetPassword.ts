import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { PasswordRecoveriesDataSource } from './contracts/PasswordRecoveriesDataSource.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

const ResetPasswordInputSchema = z.object({
  key: z.string(),
  password: z.string(),
});

type Input = z.infer<typeof ResetPasswordInputSchema>;

type Output = void;

type Deps = {
  usersDS: UsersDataSource;
  passwordRecoveriesDS: PasswordRecoveriesDataSource;
};

class ResetPassword extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const { recordId, userId } = (
      await this.deps.passwordRecoveriesDS.findByKey(input.key)
    ).getDataOrThrow();

    const user = (await this.deps.usersDS.getById(userId)).getDataOrThrow();

    if (!user) {
      throw new UserNotFound(userId);
    }

    const hashedPassword = await EncryptedPassword.create(input.password);

    await this.transactionManager.run(async () => {
      await this.deps.usersDS.updatePassword(userId, hashedPassword);
      await this.deps.usersDS.clearLockFields(userId);
      await this.deps.passwordRecoveriesDS.deleteById(recordId);
    });
  }
}

export { ResetPassword, ResetPasswordInputSchema };
export type { Deps as ResetPasswordDependencies };
