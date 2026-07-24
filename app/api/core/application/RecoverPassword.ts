import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import users from '#api/users/users.js';

const RecoverPasswordInputSchema = z.object({
  email: z.string().min(3),
  domain: z.string(),
});

type Input = z.infer<typeof RecoverPasswordInputSchema>;

type Output = void;

class RecoverPassword extends AbstractUseCase<Input, Output> {
  async execute(input: Input): Promise<Output> {
    await users.recoverPassword(input.email, input.domain);
  }
}

export { RecoverPassword, RecoverPasswordInputSchema };
